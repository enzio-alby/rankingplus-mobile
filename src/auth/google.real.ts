/**
 * IMPLEMENTAÇÃO REAL do "Entrar com Google" (Fase 2).
 *
 * `google.ts` só seleciona este hook quando `GOOGLE.androidClientId` está
 * preenchido (client Android criado no Google Cloud com o SHA-1 do
 * `eas credentials`). `Google.useAuthRequest` NÃO roda no Expo Go — precisa de um
 * development/production build (`eas build --profile development`).
 */
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE } from '@/config';
import type { PerfilGoogle } from '@/auth/google-types';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleLoginReal(onOk: (p: PerfilGoogle) => void) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE.webClientId || undefined,
    androidClientId: GOOGLE.androidClientId || undefined,
    iosClientId: GOOGLE.iosClientId || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type === 'error') setErro('Falha no login com Google.');
      setCarregando(false);
      return;
    }
    const token = response.authentication?.accessToken;
    if (!token) {
      setErro('Google não retornou um token.');
      setCarregando(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const info = (await r.json()) as { name?: string; email?: string };
        onOk({
          nome: (info.name || info.email || 'Usuario').split(' ')[0],
          email: info.email || '',
        });
      } catch {
        setErro('Não foi possível ler o perfil do Google.');
      } finally {
        setCarregando(false);
      }
    })();
  }, [response, onOk]);

  return {
    disponivel: !!GOOGLE.androidClientId && !!request,
    carregando,
    erro,
    entrar: async () => {
      setErro(null);
      setCarregando(true);
      await promptAsync();
    },
  };
}
