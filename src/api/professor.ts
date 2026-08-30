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

export function getAlunosDaDisciplina(profId: number, discId: number) {
  return comFallback<local.AlunoDaTurma[]>(
    () => apiFetch(`/professores/${profId}/disciplinas/${discId}/alunos`),
    () => local.alunosDaDisciplina(profId, discId),
  );
}
