import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import { lerAvatarLocal, salvarAvatarLocal } from '@/api_mobile';

export type TipoAvatar = 'aluno' | 'professor' | 'empresa';

const BASE: Record<TipoAvatar, string> = {
  aluno: 'alunos',
  professor: 'professores',
  empresa: 'empresas',
};

/** Limite da imagem escolhida (o corpo JSON do servidor aceita até 2 MB, e base64 incha ~33%). */
export const AVATAR_MAX_BYTES = 1024 * 1024;

export const MSG_INDISPONIVEL_DEMO = 'Disponível somente com o servidor no ar.';

function traduzir(e: unknown): never {
  if (e instanceof ApiError && e.status === 0) {
    throw new Error('Sem conexão com o servidor. Tente de novo mais tarde.');
  }
  throw e;
}

export async function salvarAvatar(tipo: TipoAvatar, id: number, avatarBase64: string) {
  if (modoLocal()) return salvarAvatarLocal(tipo, id, avatarBase64);
  try {
    await apiFetch(`/${BASE[tipo]}/${id}/avatar`, { method: 'PUT', body: { avatar_base64: avatarBase64 } });
  } catch (e) {
    traduzir(e);
  }
}

export async function removerAvatar(tipo: TipoAvatar, id: number) {
  if (modoLocal()) return salvarAvatarLocal(tipo, id, null);
  try {
    await apiFetch(`/${BASE[tipo]}/${id}/avatar`, { method: 'DELETE' });
  } catch (e) {
    traduzir(e);
  }
}

/** Foto atual da empresa (o perfil da empresa não carrega o cadastro; tenta GET /empresas/:id). */
export async function getAvatarEmpresa(id: number): Promise<string | null> {
  if (modoLocal()) return lerAvatarLocal('empresa', id);
  try {
    const r = await apiFetch<Record<string, unknown>>(`/empresas/${id}`);
    return typeof r?.avatar_base64 === 'string' ? r.avatar_base64 : null;
  } catch {
    return null;
  }
}
