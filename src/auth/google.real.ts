/**
 * IMPLEMENTAÇÃO REAL do "Entrar com Google" (Fase 2) — via
 * `@react-native-google-signin/google-signin` (SDK nativo do Google).
 *
 * Precisa de:
 *  - `GOOGLE.webClientId` (client OAuth do tipo **Web** no Google Cloud) — é o que
 *    vai no `configure()`.
 *  - Um client OAuth **Android** (package `rankingplus.p4` + SHA-1 do keystore do
 *    EAS) existindo no mesmo projeto — o Google usa pra confiar na assinatura.
 *  - Tela de consentimento OAuth criada (modo "Teste" serve; a conta que loga
 *    precisa estar em "Usuários de teste", ou o app publicado).
 *  - NÃO roda no Expo Go — só em development/preview/production build.
 */
import { useEffect, useState } from 'react';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE } from '@/config';
import type { PerfilGoogle } from '@/auth/google-types';

let _configurado = false;
function configurar() {
  if (_configurado) return;
  GoogleSignin.configure({ webClientId: GOOGLE.webClientId || undefined });
  _configurado = true;
}

export function useGoogleLoginReal(onOk: (p: PerfilGoogle) => void) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    configurar();
  }, []);

  return {
    disponivel: !!GOOGLE.webClientId,
    carregando,
    erro,
    entrar: async () => {
      setErro(null);
      setCarregando(true);
      try {
        configurar();
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const res = await GoogleSignin.signIn();
        if (isSuccessResponse(res)) {
          const u = res.data.user;
          onOk({
            nome: (u.givenName || u.name || u.email || 'Usuario').split(' ')[0],
            email: u.email || '',
          });
        }
        // type 'cancelled' → usuário fechou o seletor: sem erro visível
      } catch (e) {
        if (isErrorWithCode(e)) {
          if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) {
            // silencioso
          } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            setErro('Google Play Services indisponível ou desatualizado neste aparelho.');
          } else {
            setErro('Falha no login com Google. Tente de novo.');
          }
        } else {
          setErro('Falha no login com Google. Tente de novo.');
        }
      } finally {
        setCarregando(false);
      }
    },
  };
}
