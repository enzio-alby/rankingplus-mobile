import { GOOGLE } from '@/config';
import type { PerfilGoogle } from '@/auth/google-types';

/**
 * STUB do "Entrar com Google" — usado enquanto `GOOGLE.androidClientId` estiver
 * vazio (Fase 1). `disponivel: false` faz a SplashScreen cair no seletor de demo
 * sem pedir conta real. O seletor de qual hook usar está em `google.ts`.
 */
export function useGoogleLoginStub(_onOk: (p: PerfilGoogle) => void) {
  return {
    disponivel: false as boolean,
    carregando: false,
    erro: null as string | null,
    entrar: async () => {
      void GOOGLE;
    },
  };
}
