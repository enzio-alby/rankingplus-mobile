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
export function getTalentos(empresaId: number, f: local.FiltroTalentos = {}) {
  return comFallback<local.Talento[]>(
    async () => {
      const qs = new URLSearchParams();
      if (f.curso) qs.set('curso', String(f.curso));
      if (f.semestreMin) qs.set('semestre_min', String(f.semestreMin));
      if (f.habilidade) qs.set('habilidade', String(f.habilidade));
      const r = await apiFetch<{ talentos?: local.Talento[] }>(
        `/talentos/buscar${qs.toString() ? `?${qs}` : ''}`,
      );
      let arr = (r.talentos ?? []) as local.Talento[];
      const craMin = Number(f.craMin);
      if (Number.isFinite(craMin) && craMin > 0) {
        arr = arr.filter((t) => Number(t.media_geral ?? 0) >= craMin);
      }
      return arr;
    },
    () => local.talentos(empresaId, f),
  );
}

export function getPerfilCandidato(alunoId: number, empresaId: number) {
  return comFallback<local.PerfilCandidato>(
    () => apiFetch(`/talentos/aluno/${alunoId}/perfil?vaga_id=`),
    () => local.perfilCandidato(alunoId, empresaId),
  );
}
