import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import * as local from '@/api_mobile';

/**
 * Roteia cada leitura: modo demo → SQLite; login real → API (com fallback pro
 * SQLite se a rede cair). A UI não sabe de onde veio.
 */
async function comFallback<T>(
  viaApi: () => Promise<T>,
  viaLocal: () => Promise<T>,
): Promise<T> {
  if (modoLocal()) return viaLocal();
  try {
    return await viaApi();
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) return viaLocal();
    throw e;
  }
}

// ─── Boletim ────────────────────────────────────────────────────────────────
export function getBoletim(alunoId: number) {
  return comFallback<local.DisciplinaBoletim[]>(
    () => apiFetch(`/alunos/${alunoId}/boletim-detalhado`),
    () => local.boletimDetalhado(alunoId),
  );
}

// ─── Desempenho por semestre (gráfico) ─────────────────────────────────────
export function getDesempenho(alunoId: number) {
  return comFallback<local.SerieDesempenho>(
    async () => {
      const r = await apiFetch<{ labels?: string[]; values?: number[] }>(
        `/alunos/${alunoId}/desempenho-semestral?filtro=completo`,
      );
      return { labels: r.labels ?? [], values: (r.values ?? []).map(Number) };
    },
    () => local.desempenhoSemestral(alunoId),
  );
}

// ─── Ranking ────────────────────────────────────────────────────────────────
export function getRanking() {
  return comFallback<local.AlunoRanking[]>(
    async () => {
      const r = await apiFetch<{ alunos?: local.AlunoRanking[] }>('/ranking/detalhado');
      const arr = (r.alunos ?? []) as (local.AlunoRanking & {
        permitir_exibicao_ranking?: number;
      })[];
      // anonimiza opt-out no cliente (o /ranking/detalhado não anonimiza)
      return arr.map((a) => ({
        ...a,
        publico: a.permitir_exibicao_ranking ?? a.publico ?? 1,
        nome: (a.permitir_exibicao_ranking ?? 1) === 1 ? a.nome : 'Aluno Anônimo',
      }));
    },
    () => local.ranking(),
  );
}

// ─── Dashboard (métricas + posição) ────────────────────────────────────────
export function getDashboard(alunoId: number) {
  return comFallback<local.MetricasAluno>(
    async () => {
      const [m, boletim, rk] = await Promise.all([
        apiFetch<{
          media_geral: number | null;
          total_atividades: number | null;
          total_faltas: number | null;
          presenca_geral?: number;
        }>(`/alunos/${alunoId}/metricas`),
        apiFetch<unknown[]>(`/alunos/${alunoId}/boletim-detalhado`).catch(() => []),
        apiFetch<{ alunos?: { id: number; pontuacao: number }[] }>(
          '/ranking/detalhado',
        ).catch(() => ({ alunos: [] })),
      ]);
      const totalFaltas = Number(m.total_faltas ?? 0);
      const lista = rk.alunos ?? [];
      const eu = lista.find((a) => a.id === alunoId);
      const posicao = eu
        ? lista.filter((a) => a.pontuacao > eu.pontuacao).length + 1
        : null;
      return {
        media_geral: m.media_geral ?? null,
        total_atividades: Number(m.total_atividades ?? 0),
        total_faltas: totalFaltas,
        total_disciplinas: boletim.length,
        frequencia: m.presenca_geral ?? Math.max(0, 100 - totalFaltas * 2),
        posicao_ranking: posicao,
      };
    },
    () => local.dashboardAluno(alunoId),
  );
}
