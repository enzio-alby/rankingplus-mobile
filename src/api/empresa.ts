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

// ─── Vagas + Contratações ──────────────────────────────────────────────────
export function getVagasEmpresa(empresaId: number) {
  return comFallback<local.VagaEmpresa[]>(
    async () => {
      const r = await apiFetch<local.VagaEmpresa[] | { vagas?: local.VagaEmpresa[] }>(
        `/empresas/${empresaId}/vagas`,
      );
      return Array.isArray(r) ? r : (r.vagas ?? []);
    },
    () => local.vagasDaEmpresa(empresaId),
  );
}

export function getContratacoes(empresaId: number) {
  return comFallback<local.Contratacao[]>(
    async () => {
      const r = await apiFetch<local.Contratacao[] | { contratacoes?: local.Contratacao[] }>(
        `/empresas/${empresaId}/contratacoes`,
      );
      return Array.isArray(r) ? r : (r.contratacoes ?? []);
    },
    () => local.contratacoes(empresaId),
  );
}

// ─── Favoritos / Kanban ────────────────────────────────────────────────────
export function getFavoritos(empresaId: number) {
  return comFallback<local.Favorito[]>(
    async () => {
      const r = await apiFetch<local.Favorito[] | { favoritos?: local.Favorito[] }>(
        `/empresas/${empresaId}/favoritos`,
      );
      return Array.isArray(r) ? r : (r.favoritos ?? []);
    },
    () => local.favoritos(empresaId),
  );
}

export function getStatusFavorito(empresaId: number, alunoId: number) {
  return comFallback<local.StatusFavorito | null>(
    async () => {
      const r = await apiFetch<local.Favorito[]>(`/empresas/${empresaId}/favoritos`).catch(() => []);
      const arr = Array.isArray(r) ? r : [];
      return arr.find((f) => f.id === alunoId)?.status ?? null;
    },
    () => local.statusFavorito(empresaId, alunoId),
  );
}

export function favoritar(empresaId: number, alunoId: number) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/empresas/${empresaId}/favoritos`, {
        method: 'POST',
        body: { aluno_id: alunoId },
      });
    },
    () => local.favoritar(empresaId, alunoId),
  );
}

export function desfavoritar(empresaId: number, alunoId: number) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/empresas/${empresaId}/favoritos/${alunoId}`, { method: 'DELETE' });
    },
    () => local.desfavoritar(empresaId, alunoId),
  );
}

export function mudarStatusFavorito(empresaId: number, alunoId: number, status: local.StatusFavorito) {
  return comFallback<void>(
    async () => {
      await apiFetch(`/empresas/${empresaId}/favoritos/${alunoId}/status`, {
        method: 'PUT',
        body: { status },
      });
    },
    () => local.setStatusFavorito(empresaId, alunoId, status),
  );
}
