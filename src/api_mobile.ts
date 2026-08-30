/**
 * api_mobile — camada de dados LOCAL (monolito). Reproduz a lógica das rotas do
 * `api2.js` (web) rodando contra o SQLite local (`src/db/local.ts`). Usada no
 * modo demo e como fallback offline. Cresce conforme cada tela da Fase 3.
 *
 * Regra de ouro: MESMA regra do backend (escala de menção, anonimização LGPD,
 * fórmula de frequência) — se divergir, o app mostra número diferente do site.
 */
import { all, first, run } from '@/db/local';

/** Escala oficial menção→nota (igual `mencaoParaNotaSQL` do api2.js). */
const NOTA = (col: string) =>
  `CASE ${col} WHEN 'SS' THEN 10 WHEN 'MS' THEN 8 WHEN 'MM' THEN 6 WHEN 'MI' THEN 4 WHEN 'II' THEN 2 ELSE 0 END`;

// ─── ALUNO — BOLETIM ────────────────────────────────────────────────────────
export type DisciplinaBoletim = {
  nome_materia: string;
  sala: string | null;
  dia_semana: string | null;
  horario: string | null;
  nome_professor: string | null;
  mencao: string | null;
  faltas: number;
  nota_avaliacao: number | null;
  atividades_entregues: number;
};

export async function boletimDetalhado(alunoId: number): Promise<DisciplinaBoletim[]> {
  return all<DisciplinaBoletim>(
    `SELECT d.nome_materia, d.sala, d.dia_semana, d.horario,
            p.nome AS nome_professor,
            b.mencao, b.faltas,
            CAST(b.nota_avaliacao AS REAL) AS nota_avaliacao,
            b.atividades_entregues
       FROM boletim b
       JOIN disciplinas d ON b.disciplina_id = d.id
       LEFT JOIN professores p ON d.professor_id = p.id
      WHERE b.aluno_id = ?
      ORDER BY d.nome_materia`,
    [alunoId],
  );
}

// ─── ALUNO — DESEMPENHO POR SEMESTRE (gráfico) ─────────────────────────────
export type SerieDesempenho = { labels: string[]; values: number[] };

export async function desempenhoSemestral(alunoId: number): Promise<SerieDesempenho> {
  const rows = await all<{ sem: string; media: number }>(
    `SELECT semestre_cursado AS sem, ROUND(AVG(${NOTA('mencao')}), 1) AS media
       FROM boletim
      WHERE aluno_id = ? AND semestre_cursado IS NOT NULL
      GROUP BY semestre_cursado
      ORDER BY semestre_cursado ASC`,
    [alunoId],
  );
  return {
    labels: rows.map((r) => String(r.sem).slice(2)),
    values: rows.map((r) => Number(r.media)),
  };
}

// ─── RANKING ────────────────────────────────────────────────────────────────
export type AlunoRanking = {
  id: number;
  nome: string;
  curso: string | null;
  semestre_atual: number | null;
  pontuacao: number;
  frequencia: number;
  publico: number;
};

export type FiltroRanking = {
  curso?: string | null;
  semestre?: string | number | null;
  disciplinaId?: string | number | null;
};

export async function ranking(f: FiltroRanking = {}): Promise<AlunoRanking[]> {
  // Mesma fórmula do `/ranking/detalhado` do web: frequência por SUM de faltas.
  const cond: string[] = [];
  const params: (string | number)[] = [];
  if (f.curso) { cond.push('a.curso = ?'); params.push(f.curso); }
  if (f.semestre) { cond.push('a.semestre_atual = ?'); params.push(Number(f.semestre)); }
  if (f.disciplinaId) { cond.push('b.disciplina_id = ?'); params.push(Number(f.disciplinaId)); }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  return all<AlunoRanking>(
    `SELECT a.id, a.curso, a.semestre_atual,
            COALESCE(a.permitir_exibicao_ranking, 1) AS publico,
            CASE WHEN COALESCE(a.permitir_exibicao_ranking, 1) = 1 THEN a.nome ELSE 'Aluno Anônimo' END AS nome,
            ROUND(AVG(${NOTA('b.mencao')}), 2) AS pontuacao,
            MAX(0, ROUND(100 - SUM(CAST(b.faltas AS REAL)) * 2, 0)) AS frequencia
       FROM alunos a
       JOIN boletim b ON a.id = b.aluno_id
      ${where}
      GROUP BY a.id
      ORDER BY pontuacao DESC, frequencia DESC,
               SUM(b.atividades_entregues) DESC, a.nome ASC`,
    params,
  );
}

// ─── FILTROS DISPONÍVEIS (dropdowns) ───────────────────────────────────────
export async function filtrosDisponiveis() {
  const cursos = (await all<{ c: string }>(
    `SELECT DISTINCT curso AS c FROM alunos WHERE curso IS NOT NULL ORDER BY curso`,
  )).map((r) => r.c);
  const semestres = (await all<{ s: number }>(
    `SELECT DISTINCT semestre_atual AS s FROM alunos WHERE semestre_atual IS NOT NULL ORDER BY semestre_atual`,
  )).map((r) => r.s);
  const disciplinas = await all<{ id: number; nome_materia: string }>(
    `SELECT id, nome_materia FROM disciplinas ORDER BY nome_materia`,
  );
  return { cursos, semestres, disciplinas };
}

// ─── ALUNO — DASHBOARD (métricas + posição) ─────────────────────────────────
export type MetricasAluno = {
  media_geral: number | null;
  total_atividades: number;
  total_faltas: number;
  total_disciplinas: number;
  frequencia: number;
  posicao_ranking: number | null;
};

export async function dashboardAluno(alunoId: number): Promise<MetricasAluno> {
  const m = await first<{
    media_geral: number | null;
    total_atividades: number | null;
    total_faltas: number | null;
    total_disciplinas: number | null;
  }>(
    `SELECT ROUND(AVG(${NOTA('mencao')}), 1) AS media_geral,
            SUM(atividades_entregues) AS total_atividades,
            SUM(CAST(faltas AS REAL)) AS total_faltas,
            COUNT(*) AS total_disciplinas
       FROM boletim WHERE aluno_id = ?`,
    [alunoId],
  );

  const totalFaltas = Number(m?.total_faltas ?? 0);
  const media = m?.media_geral ?? null;

  let posicao: number | null = null;
  if (media != null) {
    // Threshold é a média CRUA do aluno (não a arredondada) — igual ao web.
    const p = await first<{ n: number }>(
      `SELECT COUNT(*) + 1 AS n FROM (
         SELECT a.id, AVG(${NOTA('b.mencao')}) AS pts
           FROM alunos a JOIN boletim b ON a.id = b.aluno_id
          GROUP BY a.id
         HAVING pts > (
           SELECT COALESCE(AVG(${NOTA('mencao')}), 0) FROM boletim WHERE aluno_id = ?
         )
       )`,
      [alunoId],
    );
    posicao = p?.n ?? null;
  }

  return {
    media_geral: media,
    total_atividades: Number(m?.total_atividades ?? 0),
    total_faltas: totalFaltas,
    total_disciplinas: Number(m?.total_disciplinas ?? 0),
    frequencia: Math.max(0, 100 - totalFaltas * 2),
    posicao_ranking: posicao,
  };
}

// ─── PROFESSOR ──────────────────────────────────────────────────────────────
export type StatsProfessor = {
  turmas: number;
  alunos: number;
  media_geral: number | null;
  presenca_media: number | null;
};

export async function statsProfessor(profId: number): Promise<StatsProfessor> {
  const t = await first<{ n: number }>(
    'SELECT COUNT(*) AS n FROM disciplinas WHERE professor_id = ?', [profId],
  );
  const a = await first<{ n: number }>(
    `SELECT COUNT(DISTINCT b.aluno_id) AS n
       FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE d.professor_id = ?`, [profId],
  );
  const m = await first<{ media: number | null; presenca: number | null }>(
    `SELECT ROUND(AVG(${NOTA('b.mencao')}), 1) AS media,
            MAX(0, ROUND(100 - AVG(CAST(b.faltas AS REAL)) * 2, 0)) AS presenca
       FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE d.professor_id = ?`, [profId],
  );
  return {
    turmas: Number(t?.n ?? 0),
    alunos: Number(a?.n ?? 0),
    media_geral: m?.media ?? null,
    presenca_media: m?.presenca ?? null,
  };
}

export type DisciplinaProfessor = {
  id: number;
  nome_materia: string;
  sala: string | null;
  dia_semana: string | null;
  horario: string | null;
  total_alunos: number;
};

export function disciplinasProfessor(profId: number) {
  return all<DisciplinaProfessor>(
    `SELECT d.id, d.nome_materia, d.sala, d.dia_semana, d.horario,
            COUNT(DISTINCT b.aluno_id) AS total_alunos
       FROM disciplinas d
       LEFT JOIN boletim b ON b.disciplina_id = d.id
      WHERE d.professor_id = ?
      GROUP BY d.id
      ORDER BY d.nome_materia`, [profId],
  );
}

export type StatDisciplina = {
  id: number;
  nome_materia: string;
  total_alunos: number;
  media: number | null;
  frequencia: number | null;
  cnt_ss: number; cnt_ms: number; cnt_mm: number; cnt_mi: number; cnt_ii: number;
};

export function statsDisciplinasProfessor(profId: number) {
  return all<StatDisciplina>(
    `SELECT d.id, d.nome_materia,
            COUNT(b.aluno_id) AS total_alunos,
            ROUND(AVG(${NOTA('b.mencao')}), 1) AS media,
            MAX(0, ROUND(100 - AVG(CAST(b.faltas AS REAL)) * 2, 0)) AS frequencia,
            SUM(CASE WHEN b.mencao = 'SS' THEN 1 ELSE 0 END) AS cnt_ss,
            SUM(CASE WHEN b.mencao = 'MS' THEN 1 ELSE 0 END) AS cnt_ms,
            SUM(CASE WHEN b.mencao = 'MM' THEN 1 ELSE 0 END) AS cnt_mm,
            SUM(CASE WHEN b.mencao = 'MI' THEN 1 ELSE 0 END) AS cnt_mi,
            SUM(CASE WHEN b.mencao = 'II' THEN 1 ELSE 0 END) AS cnt_ii
       FROM disciplinas d
       LEFT JOIN boletim b ON d.id = b.disciplina_id
      WHERE d.professor_id = ?
      GROUP BY d.id
      ORDER BY d.nome_materia`, [profId],
  );
}

export type AlunoDaTurma = {
  id: number;
  nome: string;
  matricula: string | null;
  mencao: string | null;
  faltas: number;
  nota_avaliacao: number | null;
  atividades_entregues: number;
  frequencia: number;
};

export function alunosDaDisciplina(profId: number, discId: number) {
  // Um aluno pode ter >1 linha de boletim na mesma disciplina (semestres
  // diferentes) — pega só a mais recente (maior id) pra não duplicar na lista.
  return all<AlunoDaTurma>(
    `SELECT a.id, a.nome, a.matricula, b.mencao, b.faltas,
            CAST(b.nota_avaliacao AS REAL) AS nota_avaliacao,
            b.atividades_entregues,
            MAX(0, 100 - CAST(b.faltas AS REAL) * 2) AS frequencia
       FROM boletim b
       JOIN alunos a ON b.aluno_id = a.id
       JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.disciplina_id = ? AND d.professor_id = ?
        AND b.id = (
          SELECT MAX(b2.id) FROM boletim b2
           WHERE b2.aluno_id = a.id AND b2.disciplina_id = b.disciplina_id
        )
      ORDER BY b.mencao ASC, a.nome ASC`, [discId, profId],
  );
}

// ─── EMPRESA — COMPATIBILIDADE (porta de _calcularCompatibilidade do api2.js) ─
const COMPAT_PESOS = { cra: 30, area: 25, comportamental: 20, frequencia: 10, curso: 10, semestre: 5 };
const AREAS_ADJ = [
  ['backend', 'full stack', 'frontend', 'front-end', 'web'],
  ['data science', 'dados', 'analytics', 'machine learning', 'inteligência artificial', ' ia'],
  ['devops', 'sre', 'cloud', 'infraestrutura', 'seguran'],
];
function areasAdjacentes(a: string | null, b: string | null) {
  if (!a || !b || a === b) return false;
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  return AREAS_ADJ.some((g) => g.some((k) => la.includes(k)) && g.some((k) => lb.includes(k)));
}

export type Compatibilidade = {
  score: number;
  faixa: 'alta' | 'media' | 'baixa';
  componentes: { rotulo: string; aplicavel: boolean; obtido: number; peso: number; detalhe: string }[];
};

type DadosAluno = {
  area_interesse_nome: string | null;
  curso: string | null;
  semestre: number | null;
  media_geral: number | null;
  frequencia: number | null;
  perfil_dominante: string | null;
};
type Alvo = {
  area_foco_nome: string | null;
  curso_preferido: string | null;
  semestre_minimo: number | null;
  perfis_procurados: string[];
};

function calcularCompat(al: DadosAluno, alvo: Alvo | null): Compatibilidade | null {
  if (!alvo) return null;
  const comp: Compatibilidade['componentes'] = [];
  const add = (
    chave: keyof typeof COMPAT_PESOS,
    rotulo: string,
    ap: boolean,
    frac: number,
    det: string,
  ) => {
    const peso = COMPAT_PESOS[chave];
    comp.push({ rotulo, aplicavel: ap, obtido: ap ? Math.round(peso * frac) : 0, peso, detalhe: det });
  };

  const cra = Number(al.media_geral);
  add('cra', 'Desempenho academico', Number.isFinite(cra),
    Number.isFinite(cra) ? Math.max(0, Math.min(1, cra / 10)) : 0,
    Number.isFinite(cra) ? `CRA ${cra.toFixed(1)}` : 'sem notas');

  const temArea = !!(alvo.area_foco_nome && al.area_interesse_nome);
  let fa = 0;
  let da = 'area nao informada';
  if (temArea) {
    if (al.area_interesse_nome === alvo.area_foco_nome) {
      fa = 1;
      da = `ambos em ${alvo.area_foco_nome}`;
    } else if (areasAdjacentes(al.area_interesse_nome, alvo.area_foco_nome)) {
      fa = 0.4;
      da = `${al.area_interesse_nome} ~ ${alvo.area_foco_nome}`;
    } else {
      da = `${al.area_interesse_nome} vs ${alvo.area_foco_nome}`;
    }
  }
  add('area', 'Area de atuacao', temArea, fa, da);

  const proc = alvo.perfis_procurados ?? [];
  const temComp = proc.length > 0 && !!al.perfil_dominante;
  const bate = temComp && proc.includes(al.perfil_dominante as string);
  add('comportamental', 'Perfil comportamental', temComp, bate ? 1 : 0,
    !temComp
      ? 'empresa sem perfis / aluno sem avaliacao'
      : bate
        ? `perfil "${al.perfil_dominante}" procurado`
        : `perfil "${al.perfil_dominante}" fora`);

  const fq = Number(al.frequencia);
  add('frequencia', 'Frequencia', Number.isFinite(fq),
    Number.isFinite(fq) ? Math.max(0, Math.min(1, fq / 100)) : 0,
    Number.isFinite(fq) ? `${Math.round(fq)}% presenca` : 'sem dado');

  const tc = !!alvo.curso_preferido;
  const cb = tc &&
    String(alvo.curso_preferido).trim().toLowerCase() === String(al.curso ?? '').trim().toLowerCase();
  add('curso', 'Curso', tc, cb ? 1 : 0,
    !tc ? 'nao exige curso' : cb ? `cursa ${al.curso}` : `pede ${alvo.curso_preferido}`);

  const ts = alvo.semestre_minimo != null && Number(alvo.semestre_minimo) > 0;
  const sb = ts && Number(al.semestre ?? 0) >= Number(alvo.semestre_minimo);
  add('semestre', 'Semestre', ts, sb ? 1 : 0,
    !ts ? 'sem minimo' : sb ? `${al.semestre}o sem.` : `abaixo do minimo (${alvo.semestre_minimo}o)`);

  const aplic = comp.filter((c) => c.aplicavel);
  if (!aplic.length) return null;
  const score = Math.round(
    (100 * aplic.reduce((s, c) => s + c.obtido, 0)) / aplic.reduce((s, c) => s + c.peso, 0),
  );
  return { score, faixa: score >= 75 ? 'alta' : score >= 50 ? 'media' : 'baixa', componentes: comp };
}

async function alvoDaEmpresa(empresaId: number): Promise<Alvo | null> {
  const perfis = (
    await all<{ perfil: string }>(
      'SELECT perfil FROM empresa_perfis_procurados WHERE empresa_id = ? ORDER BY ordem',
      [empresaId],
    )
  ).map((r) => r.perfil);
  const ei = await first<{
    curso_preferido: string | null;
    semestre_minimo: number | null;
    area_foco_nome: string | null;
  }>(
    `SELECT ei.curso_preferido, ei.semestre_minimo, af.nome AS area_foco_nome
       FROM empresa_interesses ei
       LEFT JOIN dom_areas_foco af ON af.id = ei.area_foco_id
      WHERE ei.empresa_id = ? LIMIT 1`,
    [empresaId],
  );
  if (!ei && !perfis.length) return null;
  return {
    area_foco_nome: ei?.area_foco_nome ?? null,
    curso_preferido: ei?.curso_preferido ?? null,
    semestre_minimo: ei?.semestre_minimo ?? null,
    perfis_procurados: perfis,
  };
}

async function dadosCompatAluno(alunoId: number): Promise<DadosAluno> {
  const a = await first<{ curso: string | null; semestre_atual: number | null }>(
    'SELECT curso, semestre_atual FROM alunos WHERE id = ?', [alunoId],
  );
  const med = await first<{ m: number | null }>(
    `SELECT ROUND(AVG(${NOTA('mencao')}), 1) AS m FROM boletim WHERE aluno_id = ?`, [alunoId],
  );
  const fq = await first<{ f: number | null }>(
    `SELECT MAX(0, 100 - SUM(CAST(faltas AS REAL)) * 2) AS f FROM boletim WHERE aluno_id = ?`, [alunoId],
  );
  const ar = await first<{ nome: string | null }>(
    `SELECT af.nome FROM perfil_profissional pp
       LEFT JOIN dom_areas_foco af ON af.id = pp.area_interesse_id
      WHERE pp.aluno_id = ?`, [alunoId],
  );
  const pf = await first<{ p: string | null }>(
    `SELECT perfil_dominante AS p FROM avaliacoes_comportamentais
      WHERE aluno_id = ? ORDER BY id DESC LIMIT 1`, [alunoId],
  );
  return {
    area_interesse_nome: ar?.nome ?? null,
    curso: a?.curso ?? null,
    semestre: a?.semestre_atual ?? null,
    media_geral: med?.m ?? null,
    frequencia: fq?.f ?? null,
    perfil_dominante: pf?.p ?? null,
  };
}

// ─── EMPRESA — PORTAL DE TALENTOS ───────────────────────────────────────────
export type Talento = {
  id: number;
  nome: string;
  curso: string | null;
  semestre: number | null;
  media_geral: number | null;
  pontos_fortes: { disciplina: string; media: number }[];
  compatibilidade: Compatibilidade | null;
};

export type FiltroTalentos = {
  curso?: string | null;
  semestreMin?: string | number | null;
  habilidade?: string | null;
  craMin?: string | number | null;
};

export async function talentos(empresaId?: number, f: FiltroTalentos = {}): Promise<Talento[]> {
  const cond = ['COALESCE(a.permitir_exibicao_ranking, 1) = 1'];
  const params: (string | number)[] = [];
  if (f.curso) { cond.push('a.curso = ?'); params.push(f.curso); }
  if (f.semestreMin) { cond.push('a.semestre_atual >= ?'); params.push(Number(f.semestreMin)); }
  // habilidade = destaque (>8.5) numa disciplina cujo nome casa
  let having = '';
  if (f.habilidade) {
    cond.push('d.nome_materia LIKE ?');
    params.push(`%${f.habilidade}%`);
    having = 'HAVING media_disc > 8.5';
  }

  const base = await all<{
    id: number;
    nome: string;
    curso: string | null;
    semestre: number | null;
    media_geral: number | null;
  }>(
    // media_geral = CRA REAL do aluno (subquery, ignora o filtro de disciplina);
    // media_disc = média só nas disciplinas que casam a habilidade (pro HAVING).
    `SELECT a.id, a.nome, a.curso, a.semestre_atual AS semestre,
            (SELECT ROUND(AVG(${NOTA('b2.mencao')}), 1) FROM boletim b2 WHERE b2.aluno_id = a.id) AS media_geral,
            ROUND(AVG(${NOTA('b.mencao')}), 2) AS media_disc
       FROM alunos a
       JOIN boletim b ON a.id = b.aluno_id
       JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE ${cond.join(' AND ')}
      GROUP BY a.id
      ${having}
      ORDER BY media_geral DESC`,
    params,
  );
  const craMin = Number(f.craMin);
  const filtrada = Number.isFinite(craMin) && craMin > 0
    ? base.filter((t) => Number(t.media_geral ?? 0) >= craMin)
    : base;
  const alvo = empresaId ? await alvoDaEmpresa(empresaId) : null;

  const out: Talento[] = [];
  for (const t of filtrada) {
    const fortes = await all<{ disciplina: string; media: number }>(
      `SELECT d.nome_materia AS disciplina, ROUND(AVG(${NOTA('b.mencao')}), 1) AS media
         FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
        WHERE b.aluno_id = ?
        GROUP BY d.id HAVING media >= 8.5
        ORDER BY media DESC LIMIT 3`,
      [t.id],
    );
    let compat: Compatibilidade | null = null;
    if (alvo) compat = calcularCompat(await dadosCompatAluno(t.id), alvo);
    out.push({
      id: t.id, nome: t.nome, curso: t.curso, semestre: t.semestre,
      media_geral: t.media_geral, pontos_fortes: fortes, compatibilidade: compat,
    });
  }
  return out;
}

export type PerfilCandidato = {
  id: number;
  nome: string;
  curso: string | null;
  semestre: number | null;
  metricas: MetricasAluno;
  disciplinas_destaque: { nome_materia: string; mencao: string | null; nota: number }[];
  compatibilidade: Compatibilidade | null;
};

export async function perfilCandidato(
  alunoId: number,
  empresaId?: number,
): Promise<PerfilCandidato> {
  const a = await first<{ nome: string; curso: string | null; semestre: number | null }>(
    'SELECT nome, curso, semestre_atual AS semestre FROM alunos WHERE id = ?', [alunoId],
  );
  const metricas = await dashboardAluno(alunoId);
  const destaque = await all<{ nome_materia: string; mencao: string | null; nota: number }>(
    `SELECT d.nome_materia, b.mencao, ROUND(${NOTA('b.mencao')}, 1) AS nota
       FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.aluno_id = ? AND b.mencao IN ('SS','MS')
      ORDER BY nota DESC LIMIT 6`,
    [alunoId],
  );
  let compat: Compatibilidade | null = null;
  if (empresaId) {
    const alvo = await alvoDaEmpresa(empresaId);
    if (alvo) compat = calcularCompat(await dadosCompatAluno(alunoId), alvo);
  }
  return {
    id: alunoId,
    nome: a?.nome ?? '',
    curso: a?.curso ?? null,
    semestre: a?.semestre ?? null,
    metricas,
    disciplinas_destaque: destaque,
    compatibilidade: compat,
  };
}

// ═══════════════ ESCRITA (edição) — modo demo grava no SQLite local ═══════════
// No demo, essas alterações são zeradas ao sair (aplicarSeed(force)).

// ─── PROFESSOR — editar lançamento ─────────────────────────────────────────
export type CamposLancamento = Partial<{
  mencao: string;
  faltas: number;
  nota_avaliacao: number | null;
  atividades_entregues: number;
  participacao_nota: number | null;
}>;

export async function atualizarLancamento(
  profId: number,
  discId: number,
  alunoId: number,
  campos: CamposLancamento,
): Promise<void> {
  const permitido: (keyof CamposLancamento)[] = [
    'mencao', 'faltas', 'nota_avaliacao', 'atividades_entregues', 'participacao_nota',
  ];
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const f of permitido) {
    if (f in campos) {
      const v = campos[f];
      sets.push(`${f} = ?`);
      vals.push(v === undefined || v === ('' as unknown) ? null : (v as string | number));
    }
  }
  if (!sets.length) return;

  const bl = await first<{ id: number }>(
    `SELECT b.id FROM boletim b JOIN disciplinas d ON b.disciplina_id = d.id
      WHERE b.aluno_id = ? AND b.disciplina_id = ? AND d.professor_id = ?
      ORDER BY b.id DESC LIMIT 1`,
    [alunoId, discId, profId],
  );
  if (!bl) throw new Error('Lançamento não encontrado.');
  vals.push(bl.id);
  await run(`UPDATE boletim SET ${sets.join(', ')} WHERE id = ?`, vals);
}

// ─── ALUNO — Meu Perfil ───────────────────────────────────────────────────
export type MeuPerfil = {
  id: number;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  github: string | null;
  linkedin: string | null;
  curso: string | null;
  semestre_atual: number | null;
  permitir_exibicao_ranking: number;
};

export function meuPerfil(alunoId: number) {
  return first<MeuPerfil>(
    `SELECT id, nome, email, telefone, github, linkedin, curso, semestre_atual,
            COALESCE(permitir_exibicao_ranking, 1) AS permitir_exibicao_ranking
       FROM alunos WHERE id = ?`,
    [alunoId],
  );
}

export type CamposPerfilAluno = Partial<{
  nome: string;
  telefone: string | null;
  github: string | null;
  linkedin: string | null;
  permitir_exibicao_ranking: number;
}>;

export async function atualizarPerfilAluno(alunoId: number, campos: CamposPerfilAluno): Promise<void> {
  const permitido: (keyof CamposPerfilAluno)[] = ['nome', 'telefone', 'github', 'linkedin', 'permitir_exibicao_ranking'];
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const f of permitido) {
    if (f in campos) {
      const v = campos[f];
      sets.push(`${f} = ?`);
      vals.push(v === undefined || v === ('' as unknown) ? null : (v as string | number));
    }
  }
  if (!sets.length) return;
  vals.push(alunoId);
  await run(`UPDATE alunos SET ${sets.join(', ')} WHERE id = ?`, vals);
}

// ─── EMPRESA — favoritos / Kanban ─────────────────────────────────────────
export const STATUS_FAVORITO = ['novo', 'contatado', 'entrevista_marcada', 'contratado', 'descartado'] as const;
export type StatusFavorito = (typeof STATUS_FAVORITO)[number];

export type Favorito = {
  id: number;
  nome: string;
  curso: string | null;
  semestre: number | null;
  status: StatusFavorito;
  media_geral: number | null;
};

export function favoritos(empresaId: number) {
  return all<Favorito>(
    `SELECT ef.aluno_id AS id, a.nome, a.curso, a.semestre_atual AS semestre, ef.status,
            (SELECT ROUND(AVG(${NOTA('mencao')}), 1) FROM boletim WHERE aluno_id = a.id) AS media_geral
       FROM empresa_favoritos ef
       JOIN alunos a ON a.id = ef.aluno_id
      WHERE ef.empresa_id = ?
      ORDER BY a.nome`,
    [empresaId],
  );
}

export async function statusFavorito(empresaId: number, alunoId: number): Promise<StatusFavorito | null> {
  const r = await first<{ status: StatusFavorito }>(
    'SELECT status FROM empresa_favoritos WHERE empresa_id = ? AND aluno_id = ?',
    [empresaId, alunoId],
  );
  return r?.status ?? null;
}

export async function favoritar(empresaId: number, alunoId: number): Promise<void> {
  const existe = await statusFavorito(empresaId, alunoId);
  if (!existe) {
    await run(
      "INSERT INTO empresa_favoritos (empresa_id, aluno_id, status) VALUES (?, ?, 'novo')",
      [empresaId, alunoId],
    );
  }
}

export async function desfavoritar(empresaId: number, alunoId: number): Promise<void> {
  await run('DELETE FROM empresa_favoritos WHERE empresa_id = ? AND aluno_id = ?', [empresaId, alunoId]);
}

export async function setStatusFavorito(
  empresaId: number,
  alunoId: number,
  status: StatusFavorito,
): Promise<void> {
  const r = await run(
    'UPDATE empresa_favoritos SET status = ? WHERE empresa_id = ? AND aluno_id = ?',
    [status, empresaId, alunoId],
  );
  if (!r.changes) {
    await run(
      'INSERT INTO empresa_favoritos (empresa_id, aluno_id, status) VALUES (?, ?, ?)',
      [empresaId, alunoId, status],
    );
  }
}
