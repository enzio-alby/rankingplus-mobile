import { useSyncExternalStore } from 'react';

/**
 * Estado global "servidor de produção fora do ar". O client marca como fora do ar
 * quando a rede falha (ApiError status 0) e como no ar quando qualquer resposta
 * HTTP chega (mesmo 4xx/5xx).
 */
let foraDoAr = false;
const ouvintes = new Set<() => void>();

function definir(v: boolean) {
  if (foraDoAr === v) return;
  foraDoAr = v;
  ouvintes.forEach((l) => l());
}

export function servidorForaDoAr(): boolean {
  return foraDoAr;
}
export function marcarServidorForaDoAr() {
  definir(true);
}
export function marcarServidorNoAr() {
  definir(false);
}

function assinar(l: () => void) {
  ouvintes.add(l);
  return () => {
    ouvintes.delete(l);
  };
}

export function useServidorForaDoAr(): boolean {
  return useSyncExternalStore(assinar, servidorForaDoAr, servidorForaDoAr);
}
