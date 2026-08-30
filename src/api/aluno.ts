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

// ─── Meu Perfil (ver + editar) ─────────────────────────────────────────────
export function getMeuPerfil(alunoId: number) {
  return comFallback<local.MeuPerfil | null>(
    async () => {
      const a = await apiFetch<Record<string, unknown>>(`/alunos/${alunoId}`);
      return {
        id: Number(a.id),
        nome: (a.nome as string) ?? null,
        email: (a.email as string) ?? null,
        telefone: (a.telefone as string) ?? null,
        github: (a.github as string) ?? null,
        linkedin: (a.linkedin as string) ?? null,
        curso: (a.curso as string) ?? null,
        semestre_atual: (a.semestre_atual as number) ?? null,
        permitir_exibicao_ranking: Number(a.permitir_exibicao_ranking ?? 1),
      };
    },
    () => local.meuPerfil(alunoId),
  );
}

export function salvarMeuPerfil(alunoId: number, campos: local.CamposPerfilAluno) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/alunos/${alunoId}`, { method: 'PUT', body: campos });
    },
    () => local.atualizarPerfilAluno(alunoId, campos),
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
export function getRanking(f: local.FiltroRanking = {}) {
  return comFallback<local.AlunoRanking[]>(
    async () => {
      const qs = new URLSearchParams();
      if (f.curso) qs.set('curso', String(f.curso));
      if (f.semestre) qs.set('semestre', String(f.semestre));
      if (f.disciplinaId) qs.set('disciplina_id', String(f.disciplinaId));
      const r = await apiFetch<{ alunos?: local.AlunoRanking[] }>(
        `/ranking/detalhado${qs.toString() ? `?${qs}` : ''}`,
      );
      const arr = (r.alunos ?? []) as (local.AlunoRanking & { permitir_exibicao_ranking?: number })[];
      return arr.map((a) => ({
        ...a,
        publico: a.permitir_exibicao_ranking ?? a.publico ?? 1,
        nome: (a.permitir_exibicao_ranking ?? 1) === 1 ? a.nome : 'Aluno Anônimo',
      }));
    },
    () => local.ranking(f),
  );
}

export function getFiltros() {
  return comFallback(
    async () => {
      const r = await apiFetch<{
        cursos?: string[];
        semestres?: (string | number)[];
        disciplinas?: { id: number; nome_materia: string }[];
      }>('/talentos/filtros');
      return {
        cursos: r.cursos ?? [],
        semestres: (r.semestres ?? []).map(Number),
        disciplinas: r.disciplinas ?? [],
      };
    },
    () => local.filtrosDisponiveis(),
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
