import * as SQLite from 'expo-sqlite';
import { decifrarSeed, SEED_VERSAO, type SeedDump } from '@/db/crypto';

const DB_NAME = 'rankingplus.db';
let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync(
    `CREATE TABLE IF NOT EXISTS _meta (chave TEXT PRIMARY KEY, valor TEXT);
     CREATE TABLE IF NOT EXISTS _demo_rows (tabela TEXT, row_id INTEGER);`,
  );
  return _db;
}

async function metaGet(db: SQLite.SQLiteDatabase, chave: string) {
  const r = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM _meta WHERE chave = ?',
    [chave],
  );
  return r?.valor ?? null;
}
async function metaSet(db: SQLite.SQLiteDatabase, chave: string, valor: string) {
  await db.runAsync(
    'INSERT INTO _meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    [chave, valor],
  );
}

/** true se o seed atual (mesma versão) já foi importado pro SQLite. */
export async function seedAplicado(): Promise<boolean> {
  const db = await getDb();
  return (await metaGet(db, 'seed_versao')) === SEED_VERSAO;
}

/**
 * Cria as tabelas a partir das chaves das linhas do dump (SQLite é dinâmico —
 * não precisa de tipos exatos) e insere todas as linhas numa transação.
 * Idempotente: se a versão do seed já foi aplicada, não faz nada.
 */
export async function aplicarSeed(force = false): Promise<void> {
  const db = await getDb();
  if (!force && (await seedAplicado())) return;

  const dump: SeedDump = decifrarSeed();
  const tabelas = Object.entries(dump.tabelas).filter(([, r]) => r.length > 0);

  await db.withTransactionAsync(async () => {
    for (const [nome, linhas] of tabelas) {
      const cols = Object.keys(linhas[0]);
      const defs = cols.map((c) => (c === 'id' ? '"id" INTEGER PRIMARY KEY' : `"${c}"`));
      await db.execAsync(`DROP TABLE IF EXISTS "${nome}"`);
      await db.execAsync(`CREATE TABLE "${nome}" (${defs.join(', ')})`);

      const ph = cols.map(() => '?').join(', ');
      const insert = `INSERT INTO "${nome}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${ph})`;
      for (const linha of linhas) {
        const vals = cols.map((c) => normalizar((linha as Record<string, unknown>)[c]));
        await db.runAsync(insert, vals);
      }
    }
    await metaSet(db, 'seed_versao', SEED_VERSAO);
    await metaSet(db, 'seed_aplicado_em', new Date().toISOString());
  });
}

/** Converte valores JS pro que o expo-sqlite aceita como bind param. */
function normalizar(v: unknown): SQLite.SQLiteBindValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'string') return v;
  // datas vêm como string ISO do JSON; objetos/arrays viram JSON
  return JSON.stringify(v);
}

// Helpers de consulta usados pelo api_mobile.ts (Fase 3).
export async function all<T = Record<string, unknown>>(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<T[]> {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params);
}
export async function first<T = Record<string, unknown>>(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<T | null> {
  const db = await getDb();
  return db.getFirstAsync<T>(sql, params);
}
export async function run(
  sql: string,
  params: SQLite.SQLiteBindValue[] = [],
): Promise<SQLite.SQLiteRunResult> {
  const db = await getDb();
  return db.runAsync(sql, params);
}
