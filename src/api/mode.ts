/**
 * Modo de dados do app.
 *
 * - `local` (modo demo): lê SEMPRE do SQLite local (`src/api_mobile.ts`). Nunca
 *   toca a API — a sessão demo tem um token que o backend real recusaria.
 * - `online` (login real): tenta a API; se cair (`ApiError(0)`), usa o SQLite
 *   como fallback offline.
 *
 * O `SessionProvider` chama `setModoLocal()` quando entra/sai de uma sessão demo.
 */
let _local = false;

export function setModoLocal(v: boolean) {
  _local = v;
}
export function modoLocal(): boolean {
  return _local;
}
