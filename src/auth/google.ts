import { GOOGLE } from '@/config';
import { useGoogleLoginStub } from '@/auth/google.stub';
import { useGoogleLoginReal } from '@/auth/google.real';

export type { PerfilGoogle } from '@/auth/google-types';

/**
 * Seletor do login com Google, decidido no load do módulo (a config não muda em
 * runtime, então as regras de hooks continuam válidas):
 *
 * - `GOOGLE.androidClientId` VAZIO   → stub (`disponivel: false`, cai no seletor
 *   de demo). É o estado da v1 / Expo Go.
 * - `GOOGLE.androidClientId` PREENCHIDO → fluxo real (`expo-auth-session`). Exige
 *   um development/production build — NÃO roda no Expo Go.
 *
 * Fase 2 = preencher `extra.googleAndroidClientId` no app.json + rodar
 *   `eas build --profile development`. Nenhuma outra mudança de código é
 *   necessária.
 */
export const useGoogleLogin = GOOGLE.androidClientId ? useGoogleLoginReal : useGoogleLoginStub;
