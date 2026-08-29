import { API_URL } from '@/config';

/**
 * Wrapper fino de fetch para a API do Ranking+.
 *
 * Diferença crítica do app antigo: TODA chamada já sai com
 * `Authorization: Bearer <token>` quando há sessão — o backend passou a exigir
 * token em ~40 rotas no fix S1 (23/08) e o app antigo não mandava nenhum,
 * então metade das telas retornava 401.
 *
 * O token e o handler de "sessão expirou" são injetados pelo SessionProvider
 * via `setAuth()` — assim o client não depende de React nem de storage.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type AuthState = {
  token: string | null;
  onUnauthorized: (() => void) | null;
};

const auth: AuthState = { token: null, onUnauthorized: null };

export function setAuth(token: string | null, onUnauthorized?: () => void) {
  auth.token = token;
  if (onUnauthorized !== undefined) auth.onUnauthorized = onUnauthorized;
}

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** rota pública: não anexa o token mesmo que exista sessão */
  publica?: boolean;
  signal?: AbortSignal;
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const { method = 'GET', body, publica = false, signal } = opts;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!publica && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    // falha de rede (fora da LAN, servidor down) — quem chama decide o fallback
    throw new ApiError(0, null, 'Sem conexão com o servidor.');
  }

  const texto = await res.text();
  const data = texto ? safeJson(texto) : null;

  if (res.status === 401 && !publica) {
    auth.token = null;
    auth.onUnauthorized?.();
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' &&
        ((data as any).mensagem || (data as any).erro || (data as any).error)) ||
      `Erro ${res.status}`;
    throw new ApiError(res.status, data, String(msg));
  }

  return data as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
