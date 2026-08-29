/**
 * api_mobile — camada de dados LOCAL (monolito). Reproduz a lógica das rotas do
 * `api2.js` (web) rodando contra o SQLite local (`src/db/local.ts`). Usada no
 * modo demo e como fallback offline. Cresce conforme cada tela da Fase 3.
 *
 * Regra de ouro: MESMA regra do backend (escala de menção, anonimização LGPD,
 * fórmula de frequência) — se divergir, o app mostra número diferente do site.
 */
import { all, first } from '@/db/local';

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

export async function ranking(): Promise<AlunoRanking[]> {
  // Mesma fórmula do `/ranking/detalhado` do web: frequência por SUM de faltas,
  // não AVG. Anonimização LGPD (opt-out) feita aqui como no `/ranking`.
  return all<AlunoRanking>(
    `SELECT a.id, a.curso, a.semestre_atual,
            COALESCE(a.permitir_exibicao_ranking, 1) AS publico,
            CASE WHEN COALESCE(a.permitir_exibicao_ranking, 1) = 1 THEN a.nome ELSE 'Aluno Anônimo' END AS nome,
            ROUND(AVG(${NOTA('b.mencao')}), 2) AS pontuacao,
            MAX(0, ROUND(100 - SUM(CAST(b.faltas AS REAL)) * 2, 0)) AS frequencia
       FROM alunos a
       JOIN boletim b ON a.id = b.aluno_id
      GROUP BY a.id
      ORDER BY pontuacao DESC, frequencia DESC,
               SUM(b.atividades_entregues) DESC, a.nome ASC`,
  );
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
