import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import {
  conversasLocais,
  mensagensLocais,
  enviarMensagemLocal,
} from '@/db/bootstrap';
import type { Papel } from '@/types/api';

export type Conversa = {
  id: number;
  outro_tipo: string;
  outro_id: number;
  outro_nome: string;
  previa: string;
  ultima_em: string;
  nao_lidas: number;
};

export type Mensagem = {
  id: number;
  remetente_tipo: string;
  remetente_id: number;
  texto: string;
  lida: boolean;
  criado_em: string;
};

async function comFallback<T>(viaApi: () => Promise<T>, viaLocal: () => Promise<T>): Promise<T> {
  if (modoLocal()) return viaLocal();
  try {
    return await viaApi();
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) return viaLocal();
    throw e;
  }
}

export function getConversas(tipo: Papel, id: number) {
  return comFallback<Conversa[]>(
    () => apiFetch(`/chat/conversas/participante/${tipo}/${id}`),
    () => conversasLocais() as Promise<Conversa[]>,
  );
}

export function getMensagens(conversaId: number) {
  return comFallback<Mensagem[]>(
    () => apiFetch(`/chat/conversas/${conversaId}/mensagens`),
    () => mensagensLocais(conversaId) as Promise<Mensagem[]>,
  );
}

export function enviarMensagem(conversaId: number, tipo: Papel, id: number, texto: string) {
  return comFallback<unknown>(
    () =>
      apiFetch(`/chat/conversas/${conversaId}/mensagens`, {
        method: 'POST',
        body: { texto },
      }),
    () => enviarMensagemLocal(conversaId, tipo, id, texto),
  );
}
