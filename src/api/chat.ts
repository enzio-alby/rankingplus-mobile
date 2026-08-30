import { apiFetch, apiUpload, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import {
  conversasLocais,
  mensagensLocais,
  enviarMensagemLocal,
  contatosLocais,
  abrirConversaLocal,
} from '@/db/bootstrap';
import type { Papel } from '@/types/api';

export type Contato = { id: number; nome: string; permite_contato?: boolean };
export type Contatos = { professores: Contato[]; alunos: Contato[] };

/** Limite de anexo — casa com o multer do backend (`_chatPdfUpload`, 5 MB). */
export const ANEXO_MAX_BYTES = 5 * 1024 * 1024;

export type AnexoMensagem = {
  id: number;
  nome: string;
  tamanho_bytes: number;
  expirado?: boolean;
};

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
  anexo?: AnexoMensagem | null;
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

/** Contatos com quem dá pra iniciar uma conversa (só aluno e professor). */
export function getContatos(tipo: Papel, id: number) {
  return comFallback<Contatos>(
    async () => {
      const r = await apiFetch<{ professores?: Contato[]; alunos?: Contato[] }>(
        `/chat/contatos/${tipo}/${id}`,
      );
      return { professores: r.professores ?? [], alunos: r.alunos ?? [] };
    },
    () => contatosLocais(tipo, id),
  );
}

/** Abre (ou reaproveita) a conversa com o contato escolhido. Retorna o id. */
export function abrirConversa(
  meuTipo: Papel,
  meuId: number,
  outroTipo: Papel,
  outroId: number,
  outroNome: string,
) {
  return comFallback<{ conversa_id: number }>(
    () =>
      apiFetch(`/chat/conversas`, {
        method: 'POST',
        body: { outro_tipo: outroTipo, outro_id: outroId },
      }),
    () => abrirConversaLocal(outroTipo, outroId, outroNome),
  );
}

export function getMensagens(conversaId: number) {
  return comFallback<Mensagem[]>(
    () => apiFetch(`/chat/conversas/${conversaId}/mensagens`),
    () => mensagensLocais(conversaId) as Promise<Mensagem[]>,
  );
}

export function enviarMensagem(
  conversaId: number,
  tipo: Papel,
  id: number,
  texto: string,
  anexoId?: number,
) {
  return comFallback<unknown>(
    () =>
      apiFetch(`/chat/conversas/${conversaId}/mensagens`, {
        method: 'POST',
        body: { texto, anexo_id: anexoId ?? null },
      }),
    // Demo não envia anexo (a UI bloqueia antes) — só o texto vai pro SQLite.
    () => enviarMensagemLocal(conversaId, tipo, id, texto),
  );
}

/**
 * Sobe um PDF pro backend (`POST /chat/anexos`, multipart campo `pdf`). Só faz
 * sentido logado de verdade — a demo não tem token que o backend aceite.
 * Retorna o `anexo_id` pra anexar na mensagem seguinte.
 */
export async function enviarAnexoChat(
  fileUri: string,
  fileName: string,
): Promise<{ anexo_id: number; nome: string; tamanho_bytes: number }> {
  const form = new FormData();
  form.append('pdf', {
    uri: fileUri,
    name: fileName || 'anexo.pdf',
    type: 'application/pdf',
  } as unknown as Blob);
  return apiUpload('/chat/anexos', form);
}
