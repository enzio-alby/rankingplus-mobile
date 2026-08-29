// @ts-nocheck — arquivo parqueado; só entra no build quando virar `google.ts` na Fase 2.
/**
 * IMPLEMENTAÇÃO REAL do login com Google — NÃO importar ainda.
 *
 * `Google.useAuthRequest` lança no render (Android) sem `androidClientId`, então
 * só ligar isto quando `GOOGLE.androidClientId` estiver preenchido em app.json
 * (client Android criado no Google Cloud com o SHA-1 de `eas credentials`) E o
 * app estiver rodando como development/production build (não Expo Go).
 *
 * Pra ativar: renomear este arquivo pra `google.ts` (substituindo o stub).
 */
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE } from '@/config';
import type { PerfilGoogle } from '@/auth/google-types';

export type { PerfilGoogle } from '@/auth/google-types';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleLogin(onOk: (p: PerfilGoogle) => void) {
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
