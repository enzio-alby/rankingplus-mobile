import { GOOGLE } from '@/config';
import type { PerfilGoogle } from '@/auth/google-types';

export type { PerfilGoogle } from '@/auth/google-types';

/**
 * STUB do "Entrar com Google".
 *
 * O provider real (`expo-auth-session/providers/google`) LANÇA na hora do render
 * no Android se `androidClientId` não estiver definido — e o client Android só
 * existe depois do `eas credentials` (SHA-1) + `eas build`. Enquanto isso, este
 * stub retorna `disponivel: false` e a `SplashScreen` cai no fluxo mock (nome
 * "Usuario"), sem quebrar nada.
 *
 * FASE 2: quando `GOOGLE.androidClientId` estiver preenchido, trocar este
 * arquivo pela implementação de `google.real.ts` (já escrita, comentada lá).
 */
export function useGoogleLogin(_onOk: (p: PerfilGoogle) => void) {
  return {
    disponivel: false as boolean,
    carregando: false,
    erro: null as string | null,
    entrar: async () => {
      void GOOGLE; // evita "unused"
    },
  };
}
