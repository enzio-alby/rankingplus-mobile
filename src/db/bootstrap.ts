import { getDb, aplicarSeed, seedAplicado, first, run } from '@/db/local';
import { DEMO_TTL_HORAS } from '@/config';
import type { Papel, Sessao } from '@/types/api';

/**
 * Usuários de referência que o modo demo "veste". O demo usa o id real deles
 * pras leituras (dados reais), com o NOME trocado pra `<nomeGoogle>_<sufixo>`.
 * As edições que o demo fizer gravam no SQLite local normalmente; ao sair (ou
 * no próximo cold start) o seed é reaplicado (`force`), zerando tudo — é isso
 * que garante "apaga o histórico de edições ao sair".
 */
const REF_DEMO: Record<Papel, number> = {
  aluno: 21, // aluno real com mais dados (boletim, ranking, perfil comportamental)
  professor: 1, // professor real com 2 disciplinas e ~44 lançamentos
  empresa: 7, // empresa real (Portal de Talentos, vaga, favoritos, contratação)
};

type DemoAtivo = {
  modo: Papel;
  refId: number;
  nomeExibicao: string;
  expiraEm: string;
};

async function lerDemoAtivo(): Promise<DemoAtivo | null> {
  const r = await first<{ valor: string }>(
    'SELECT valor FROM _meta WHERE chave = ?',
    ['demo_ativo'],
  );
  return r ? (JSON.parse(r.valor) as DemoAtivo) : null;
}

/** Chamar no start do app: garante o seed e limpa demo órfão (app morreu no meio). */
export async function bootLocalDb(): Promise<void> {
  await getDb();
  const demo = await lerDemoAtivo();
  if (demo) {
    // sessão demo anterior não encerrada -> reaplica seed e limpa a flag
    await aplicarSeed(true);
    await run('DELETE FROM _meta WHERE chave = ?', ['demo_ativo']);
  } else if (!(await seedAplicado())) {
    await aplicarSeed();
  }
}

/** Inicia o modo demo local (sem rede). */
export async function iniciarDemoLocal(
  modo: Papel,
  nomeGoogle: string,
): Promise<Sessao> {
  if (!(await seedAplicado())) await aplicarSeed();

  const refId = REF_DEMO[modo];
  const nomeExibicao = `${nomeGoogle}_${modo}demo`;
  const expiraEm = new Date(
    Date.now() + DEMO_TTL_HORAS * 3600_000,
  ).toISOString();

  const ativo: DemoAtivo = { modo, refId, nomeExibicao, expiraEm };
  await run(
    'INSERT INTO _meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    ['demo_ativo', JSON.stringify(ativo)],
  );

  return {
    id: refId,
    nome: nomeExibicao,
    tipo: modo,
    token: `demo-local-${modo}-${refId}`,
    demo: { modo, expiraEm },
  };
}

/**
 * Encerra o modo demo: reaplica o seed (zera edições) e limpa a flag.
 * Idempotente e barato quando não há demo ativo (só uma leitura no `_meta`),
 * então pode ser chamado em todo logout sem precisar checar antes.
 */
export async function encerrarDemoLocal(): Promise<void> {
  if (!(await lerDemoAtivo())) return;
  await aplicarSeed(true);
  await run('DELETE FROM _meta WHERE chave = ?', ['demo_ativo']);
}

/** Nome de exibição do demo ativo (pro api_mobile.ts sobrescrever o nome real). */
export async function nomeDemoAtivo(): Promise<{ refId: number; nome: string } | null> {
  const d = await lerDemoAtivo();
  return d ? { refId: d.refId, nome: d.nomeExibicao } : null;
}
