import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import * as local from '@/api_mobile';

async function comFallback<T>(viaApi: () => Promise<T>, viaLocal: () => Promise<T>): Promise<T> {
  if (modoLocal()) return viaLocal();
  try {
    return await viaApi();
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) return viaLocal();
    throw e;
  }
}

export function getStatsProfessor(profId: number) {
  return comFallback<local.StatsProfessor>(
    () => apiFetch(`/professores/${profId}/stats`),
    () => local.statsProfessor(profId),
  );
}

export function getDisciplinasProfessor(profId: number) {
  return comFallback<local.DisciplinaProfessor[]>(
    () => apiFetch(`/professores/${profId}/disciplinas`),
    () => local.disciplinasProfessor(profId),
  );
}

export function getStatsDisciplinas(profId: number) {
  return comFallback<local.StatDisciplina[]>(
    () => apiFetch(`/professores/${profId}/disciplinas/stats`),
    () => local.statsDisciplinasProfessor(profId),
  );
}

/** Evolução da média da turma por semestre — gráfico dentro de Turmas / Relatórios. */
export function getEvolucaoTurma(discId: number) {
  return comFallback<local.SerieDesempenho>(
    async () => {
      const r = await apiFetch<{ labels?: string[]; values?: number[] }>(
        `/disciplinas/${discId}/evolucao`,
      );
      return { labels: r.labels ?? [], values: (r.values ?? []).map(Number) };
    },
    () => local.evolucaoTurma(discId),
  );
}

/** Envia um aviso pra turma (vira notificação 'aviso_turma' pros alunos). */
export function enviarAvisoTurma(discId: number, mensagem: string) {
  return comFallback<{ mensagem: string }>(
    () => apiFetch(`/disciplinas/${discId}/aviso`, { method: 'POST', body: { mensagem } }),
    () => local.enviarAvisoTurmaLocal(discId, mensagem),
  );
}

export function getPerfilProfessor(id: number) {
  return comFallback<local.PerfilProfessor | null>(
    async () => {
      const p = await apiFetch<Record<string, unknown>>(`/professores/${id}`);
      return {
        id: Number(p.id),
        nome: (p.nome as string) ?? null,
        email: (p.email as string) ?? null,
        telefone: (p.telefone as string) ?? null,
        titulacao: (p.titulacao as string) ?? null,
        area_atuacao: (p.area_atuacao as string) ?? null,
        turno: (p.turno as string) ?? null,
        campus: (p.campus as string) ?? null,
      };
    },
    () => local.perfilProfessor(id),
  );
}

export function salvarPerfilProfessor(id: number, campos: local.CamposPerfilProfessor) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/professores/${id}`, { method: 'PUT', body: campos });
    },
    () => local.atualizarPerfilProfessor(id, campos),
  );
}

export function salvarLancamento(
  profId: number,
  discId: number,
  alunoId: number,
  campos: local.CamposLancamento,
) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/professores/${profId}/disciplinas/${discId}/alunos/${alunoId}/boletim`, {
        method: 'PUT',
        body: campos,
      });
    },
    () => local.atualizarLancamento(profId, discId, alunoId, campos),
  );
}

export async function getAlunosDaDisciplina(profId: number, discId: number) {
  const rows = await comFallback<local.AlunoDaTurma[]>(
    () => apiFetch(`/professores/${profId}/disciplinas/${discId}/alunos`),
    () => local.alunosDaDisciplina(profId, discId),
  );
  // O endpoint do web pode devolver o mesmo aluno 2x (2 semestres) — dedup por id.
  const vistos = new Set<number>();
  return rows.filter((a) => (vistos.has(a.id) ? false : (vistos.add(a.id), true)));
}
