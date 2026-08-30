import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import * as local from '@/api_mobile';
import type { Papel } from '@/types/api';

async function comFallback<T>(viaApi: () => Promise<T>, viaLocal: () => Promise<T>): Promise<T> {
  if (modoLocal()) return viaLocal();
  try {
    return await viaApi();
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) return viaLocal();
    throw e;
  }
}

// O backend só tem rota de notificações para aluno e empresa. Professor: local
// (no online, lista vazia — não é erro).
function temRotaOnline(tipo: Papel) {
  return tipo === 'aluno' || tipo === 'empresa';
}
function base(tipo: Papel) {
  return tipo === 'empresa' ? 'empresas' : 'alunos';
}

export function getNotificacoes(tipo: Papel, id: number) {
  return comFallback<local.Notificacao[]>(
    async () => {
      if (!temRotaOnline(tipo)) return [];
      const r = await apiFetch<local.Notificacao[] | { notificacoes?: local.Notificacao[] }>(
        `/${base(tipo)}/${id}/notificacoes`,
      );
      return Array.isArray(r) ? r : (r.notificacoes ?? []);
    },
    () => local.notificacoesLocais(tipo, id),
  );
}

export function contarNaoLidas(tipo: Papel, id: number) {
  return comFallback<number>(
    async () => {
      if (!temRotaOnline(tipo)) return 0;
      const r = await apiFetch<local.Notificacao[] | { notificacoes?: local.Notificacao[] }>(
        `/${base(tipo)}/${id}/notificacoes`,
      );
      const arr = Array.isArray(r) ? r : (r.notificacoes ?? []);
      return arr.filter((n) => !Number(n.lida)).length;
    },
    () => local.contarNaoLidasLocal(tipo, id),
  );
}

export function marcarLida(tipo: Papel, id: number, notifId: number) {
  return comFallback<unknown>(
    async () => {
      if (temRotaOnline(tipo)) {
        await apiFetch(`/${base(tipo)}/${id}/notificacoes/${notifId}/lida`, { method: 'PUT' });
      }
    },
    () => local.marcarLidaLocal(tipo, id, notifId),
  );
}

export function marcarTodasLidas(tipo: Papel, id: number) {
  return comFallback<unknown>(
    async () => {
      if (temRotaOnline(tipo)) {
        await apiFetch(`/${base(tipo)}/${id}/notificacoes/marcar-todas-lidas`, { method: 'PUT' });
      }
    },
    () => local.marcarTodasLidasLocal(tipo, id),
  );
}
