/**
 * export-seed.js — exporta o estado atual do MySQL `universidade_ranking` para
 * um blob AES (cifrado com `crypto-js`, o mesmo que o app usa pra decifrar) e
 * grava em `src/db/seed-data.ts` como constante string.
 *
 * Por que uma constante `.ts` e não um asset: assim o Metro empacota sem
 * precisar de `metro.config.js` custom nem `expo-asset`/`FileSystem` — o app só
 * dá `import { SEED_ENC } from './seed-data'`.
 *
 * Uso:
 *   node scripts/export-seed.js                # cifrado -> src/db/seed-data.ts
 *   node scripts/export-seed.js --plain        # + JSON em claro em assets/seed.dev.json (debug)
 *
 * Credenciais: lê o .env do backend web (não duplica segredo).
 *   ../RANKING+/Backend/.env  (DB_HOST, DB_USER, DB_PASS, DB_NAME)
 * Chave de cifra: env SEED_KEY, ou o mesmo default de src/config.ts.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

const BACKEND_ENV = path.resolve(
  __dirname, '..', '..', '..', 'RANKING+', 'Backend', '.env',
);
const OUT_TS = path.resolve(__dirname, '..', 'src', 'db', 'seed-data.ts');
const OUT_PLAIN = path.resolve(__dirname, '..', 'assets', 'seed.dev.json');

const SEED_KEY =
  process.env.SEED_KEY || 'rankingplus-p4-seed-2026-uniceub-pi4-key';

// Tabelas que as telas do mobile usam. Tabela que não existir é pulada.
const TABELAS = [
  'alunos', 'professores', 'disciplinas', 'boletim',
  'empresas', 'empresa_interesses', 'empresa_vagas', 'empresa_favoritos',
  'empresa_perfis_procurados', 'vaga_interesses', 'interacoes_empresas_alunos',
  'dom_setores', 'dom_areas_foco', 'dom_tipos_vaga',
  'perfil_profissional', 'pp_experiencias', 'pp_formacoes', 'pp_idiomas',
  'pp_habilidades', 'pp_certificacoes',
  'questionarios_comportamentais', 'perguntas_comportamentais',
  'opcoes_resposta', 'avaliacoes_comportamentais', 'respostas_comportamentais',
  'contratacoes_checkins', 'notificacoes',
];

function lerEnv(arquivo) {
  const txt = fs.readFileSync(arquivo, 'utf8');
  const env = {};
  for (const linha of txt.split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

async function main() {
  const mysql = require('mysql2/promise');
  const env = lerEnv(BACKEND_ENV);
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASS || '',
    database: env.DB_NAME || 'universidade_ranking',
  });

  const dump = { geradoEm: new Date().toISOString(), tabelas: {} };
  for (const t of TABELAS) {
    try {
      const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
      dump.tabelas[t] = rows;
      console.log(`  ${t.padEnd(32)} ${rows.length} linhas`);
    } catch (e) {
      console.log(`  ${t.padEnd(32)} (pulada: ${e.code || e.message})`);
    }
  }
  await conn.end();

  const json = JSON.stringify(dump);
  const cifrado = CryptoJS.AES.encrypt(json, SEED_KEY).toString();

  const header =
    '// GERADO por scripts/export-seed.js — NÃO editar à mão. NÃO versionar.\n' +
    `// Snapshot do banco em ${dump.geradoEm}. Cifrado (AES/crypto-js) com SEED_KEY.\n` +
    '// eslint-disable\n';
  fs.writeFileSync(
    OUT_TS,
    `${header}export const SEED_ENC = ${JSON.stringify(cifrado)};\n` +
      `export const SEED_GERADO_EM = ${JSON.stringify(dump.geradoEm)};\n`,
  );
  console.log(`\nOK -> ${path.relative(process.cwd(), OUT_TS)} (${(cifrado.length / 1024).toFixed(1)} KB cifrado)`);

  if (process.argv.includes('--plain')) {
    fs.writeFileSync(OUT_PLAIN, JSON.stringify(dump, null, 0));
    console.log(`     -> ${path.relative(process.cwd(), OUT_PLAIN)} (em claro, debug)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
