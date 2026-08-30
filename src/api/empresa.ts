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

/** Portal de Talentos — lista de candidatos com % de compatibilidade. */
export function getTalentos(empresaId: number) {
  return comFallback<local.Talento[]>(
    async () => {
      const r = await apiFetch<{ talentos?: local.Talento[] }>(`/talentos/buscar`);
      return (r.talentos ?? []) as local.Talento[];
    },
    () => local.talentos(empresaId),
  );
}

export function getPerfilCandidato(alunoId: number, empresaId: number) {
  return comFallback<local.PerfilCandidato>(
    () => apiFetch(`/talentos/aluno/${alunoId}/perfil?vaga_id=`),
    () => local.perfilCandidato(alunoId, empresaId),
  );
}
