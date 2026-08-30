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

export function getPerfilCandidato(alunoId: number, empresaId?: number) {
  return comFallback<local.PerfilCandidato>(
    () => apiFetch(`/talentos/aluno/${alunoId}/perfil?vaga_id=`),
    () => local.perfilCandidato(alunoId, empresaId),
  );
}

// ─── Vagas + Contratações ──────────────────────────────────────────────────
export function getVagasEmpresa(empresaId: number) {
  return comFallback<local.VagaEmpresa[]>(
    async () => {
      const r = await apiFetch<
        (local.VagaEmpresa & { interessados_count?: number })[] | { vagas?: local.VagaEmpresa[] }
      >(`/empresas/${empresaId}/vagas`);
      const arr = Array.isArray(r) ? r : (r.vagas ?? []);
      // o backend devolve `interessados_count`; a UI usa `interessados`.
      return arr.map((v) => ({
        ...v,
        interessados: Number((v as { interessados_count?: number }).interessados_count ?? v.interessados ?? 0),
      }));
    },
    () => local.vagasDaEmpresa(empresaId),
  );
}

export function getTiposVaga() {
  return comFallback<local.TipoVaga[]>(
    async () => {
      const r = await apiFetch<local.TipoVaga[] | { tipos?: local.TipoVaga[] }>('/dom/tipos-vaga');
      return Array.isArray(r) ? r : (r.tipos ?? []);
    },
    () => local.tiposVaga(),
  );
}

// ─── Interesses de Perfil (o que a empresa busca) ─────────────────────────
export function getInteressesEmpresa(empresaId: number) {
  return comFallback<local.InteressesEmpresa>(
    async () => {
      const e = await apiFetch<{
        interesses?: {
          area_foco_id?: number | null;
          tipo_vaga_id?: number | null;
          area_foco_nome?: string | null;
          tipo_vaga_nome?: string | null;
          curso_preferido?: string | null;
          semestre_minimo?: number | null;
        }[];
        perfis_procurados?: string[];
      }>(`/empresas/${empresaId}`);
      const i = e.interesses?.[0] ?? {};
      return {
        area_foco_id: i.area_foco_id ?? null,
        tipo_vaga_id: i.tipo_vaga_id ?? null,
        area_foco_nome: i.area_foco_nome ?? null,
        tipo_vaga_nome: i.tipo_vaga_nome ?? null,
        curso_preferido: i.curso_preferido ?? null,
        semestre_minimo: i.semestre_minimo ?? null,
        perfis_procurados: e.perfis_procurados ?? [],
      };
    },
    () => local.interessesEmpresa(empresaId),
  );
}

export function salvarInteressesEmpresa(empresaId: number, campos: local.CamposInteresses) {
  return comFallback<unknown>(
    () => apiFetch(`/empresas/${empresaId}/interesses`, { method: 'PUT', body: campos }),
    () => local.salvarInteressesEmpresa(empresaId, campos),
  );
}

export function criarVaga(empresaId: number, campos: local.CamposVaga) {
  return comFallback<{ id: number }>(
    () => apiFetch(`/empresas/${empresaId}/vagas`, { method: 'POST', body: campos }),
    () => local.criarVagaLocal(empresaId, campos),
  );
}

export function atualizarVaga(empresaId: number, vagaId: number, campos: local.CamposVaga) {
  return comFallback<unknown>(
    () => apiFetch(`/empresas/${empresaId}/vagas/${vagaId}`, { method: 'PUT', body: campos }),
    () => local.atualizarVagaLocal(empresaId, vagaId, campos),
  );
}

/** Vagas da empresa em que o aluno tem interesse (pra mostrar no topo do chat). */
export function getVagasDeInteresse(empresaId: number, alunoId: number) {
  return comFallback<{ id: number; titulo: string }[]>(
    async () => {
      // Sem rota direta no backend — varre as vagas da empresa (até 15) e checa
      // os interessados de cada uma.
      const vagas = await getVagasEmpresa(empresaId).catch(() => []);
      const out: { id: number; titulo: string }[] = [];
      for (const v of vagas.slice(0, 15)) {
        try {
          const inter = await apiFetch<{ id: number }[]>(
            `/empresas/${empresaId}/vagas/${v.id}/interessados`,
          );
          if (Array.isArray(inter) && inter.some((x) => Number(x.id) === alunoId)) {
            out.push({ id: v.id, titulo: v.titulo });
          }
        } catch {
          /* ignora vaga que falhar */
        }
      }
      return out;
    },
    () => local.vagasDeInteresse(empresaId, alunoId),
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
