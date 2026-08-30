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
