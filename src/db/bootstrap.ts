import { getDb, aplicarSeed, seedAplicado, first, all, run } from '@/db/local';
import { DEMO_TTL_HORAS } from '@/config';
import type { Papel, Sessao } from '@/types/api';

/**
 * Usuários de referência que o modo demo "veste". O demo usa o id real deles
 * pras leituras (dados reais), com o NOME trocado pra `<nomeGoogle>_<sufixo>`.
 * As edições que o demo fizer gravam no SQLite local normalmente; ao sair (ou
 * no próximo cold start) o seed é reaplicado (`force`), zerando tudo.
 */
const REF_DEMO: Record<Papel, number> = {
  aluno: 21,
  professor: 1,
  empresa: 7,
};

type DemoAtivo = {
  modo: Papel;
  refId: number;
  nomeExibicao: string;
  expiraEm: string;
};

async function lerDemoAtivo(): Promise<DemoAtivo | null> {
  const r = await first<{ valor: string }>('SELECT valor FROM _meta WHERE chave = ?', ['demo_ativo']);
  return r ? (JSON.parse(r.valor) as DemoAtivo) : null;
}

async function limparChatLocal() {
  try {
    await run('DELETE FROM chat_mensagens');
    await run('DELETE FROM chat_conversas');
  } catch {
    /* tabelas ainda não existem — ignora */
  }
}

/** Chat de exemplo pro modo demo não abrir vazio. Nunca deve bloquear o login:
 *  se algo falhar, o demo entra mesmo assim, só sem a conversa de exemplo. */
async function semearChatDemo(modo: Papel) {
  try {
    await _semearChatDemo(modo);
  } catch (e) {
    console.warn('[chat] semearChatDemo falhou (ignorado):', e);
  }
}

async function _semearChatDemo(modo: Papel) {
  await limparChatLocal();
  const agora = new Date().toISOString();
  if (modo === 'aluno') {
    const p = await first<{ id: number; nome: string }>(
      'SELECT id, nome FROM professores ORDER BY id LIMIT 1',
    );
    if (p) {
      const c = await run(
        "INSERT INTO chat_conversas (outro_tipo, outro_id, outro_nome, criado_em) VALUES ('professor', ?, ?, ?)",
        [p.id, p.nome, agora],
      );
      await run(
        "INSERT INTO chat_mensagens (conversa_id, remetente_tipo, remetente_id, texto_cifrado, criado_em) VALUES (?, 'professor', ?, ?, ?)",
        [c.lastInsertRowId, p.id, 'Olá! Qualquer dúvida sobre a disciplina, é só chamar aqui. 👋', agora],
      );
    }
  } else if (modo === 'empresa') {
    const a = await first<{ id: number; nome: string }>(
      'SELECT id, nome FROM alunos WHERE COALESCE(permitir_exibicao_ranking,1)=1 ORDER BY id LIMIT 1',
    );
    if (a) {
      const c = await run(
        "INSERT INTO chat_conversas (outro_tipo, outro_id, outro_nome, criado_em) VALUES ('aluno', ?, ?, ?)",
        [a.id, a.nome, agora],
      );
      await run(
        "INSERT INTO chat_mensagens (conversa_id, remetente_tipo, remetente_id, texto_cifrado, criado_em) VALUES (?, 'aluno', ?, ?, ?)",
        [c.lastInsertRowId, a.id, 'Tenho interesse na vaga! Quando podemos conversar? 🙂', agora],
      );
    }
  }
}

/** Chamar no start do app: garante o seed e limpa demo órfão. */
export async function bootLocalDb(): Promise<void> {
  await getDb();
  const demo = await lerDemoAtivo();
  if (demo) {
    await aplicarSeed(true);
    await limparChatLocal();
    await run('DELETE FROM _meta WHERE chave = ?', ['demo_ativo']);
  } else if (!(await seedAplicado())) {
    await aplicarSeed();
  }
}

export async function iniciarDemoLocal(modo: Papel, nomeGoogle: string): Promise<Sessao> {
  if (!(await seedAplicado())) await aplicarSeed();

  const refId = REF_DEMO[modo];
  const nomeExibicao = `${nomeGoogle}_${modo}demo`;
  const expiraEm = new Date(Date.now() + DEMO_TTL_HORAS * 3600_000).toISOString();

  const ativo: DemoAtivo = { modo, refId, nomeExibicao, expiraEm };
  await run(
    'INSERT INTO _meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    ['demo_ativo', JSON.stringify(ativo)],
  );
  await semearChatDemo(modo);

  return {
    id: refId,
    nome: nomeExibicao,
    tipo: modo,
    token: `demo-local-${modo}-${refId}`,
    demo: { modo, expiraEm },
  };
}

/** Encerra o modo demo: reaplica o seed (zera edições) e limpa a flag + chat. */
export async function encerrarDemoLocal(): Promise<void> {
  if (!(await lerDemoAtivo())) return;
  await aplicarSeed(true);
  await limparChatLocal();
  await run('DELETE FROM _meta WHERE chave = ?', ['demo_ativo']);
}

export async function nomeDemoAtivo(): Promise<{ refId: number; nome: string } | null> {
  const d = await lerDemoAtivo();
  return d ? { refId: d.refId, nome: d.nomeExibicao } : null;
}

// ─── Chat LOCAL (modo demo) ────────────────────────────────────────────────
// Guardado em texto puro: é efêmero, fica só neste aparelho e some ao sair.
// (A criptografia em repouso é uma feature do backend, no modo online.)
async function garantirChatTabelas() {
  const db = await getDb();
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS chat_conversas (id INTEGER PRIMARY KEY AUTOINCREMENT, outro_tipo TEXT, outro_id INTEGER, outro_nome TEXT, criado_em TEXT)',
  );
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS chat_mensagens (id INTEGER PRIMARY KEY AUTOINCREMENT, conversa_id INTEGER, remetente_tipo TEXT, remetente_id INTEGER, texto_cifrado TEXT, criado_em TEXT)',
  );
}

export async function conversasLocais() {
  await garantirChatTabelas();
  const rows = await all<{
    id: number;
    outro_tipo: string;
    outro_id: number;
    outro_nome: string;
    criado_em: string;
  }>('SELECT * FROM chat_conversas ORDER BY id DESC');
  return Promise.all(
    rows.map(async (c) => {
      const ult = await first<{ texto_cifrado: string; criado_em: string }>(
        'SELECT texto_cifrado, criado_em FROM chat_mensagens WHERE conversa_id = ? ORDER BY id DESC LIMIT 1',
        [c.id],
      );
      return {
        id: c.id,
        outro_tipo: c.outro_tipo,
        outro_id: c.outro_id,
        outro_nome: c.outro_nome,
        previa: (ult?.texto_cifrado ?? '').slice(0, 80),
        ultima_em: ult?.criado_em ?? c.criado_em,
        nao_lidas: 0,
      };
    }),
  );
}

export async function mensagensLocais(conversaId: number) {
  await garantirChatTabelas();
  const rows = await all<{
    id: number;
    remetente_tipo: string;
    remetente_id: number;
    texto_cifrado: string;
    criado_em: string;
  }>('SELECT * FROM chat_mensagens WHERE conversa_id = ? ORDER BY id ASC', [conversaId]);
  return rows.map((m) => ({
    id: m.id,
    remetente_tipo: m.remetente_tipo,
    remetente_id: m.remetente_id,
    texto: m.texto_cifrado ?? '',
    lida: true,
    criado_em: m.criado_em,
  }));
}

export async function enviarMensagemLocal(
  conversaId: number,
  meuTipo: string,
  meuId: number,
  texto: string,
) {
  await garantirChatTabelas();
  await run(
    'INSERT INTO chat_mensagens (conversa_id, remetente_tipo, remetente_id, texto_cifrado, criado_em) VALUES (?, ?, ?, ?, ?)',
    [conversaId, meuTipo, meuId, texto, new Date().toISOString()],
  );
}
