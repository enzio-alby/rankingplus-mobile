import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuth } from '@/api/client';
import { setModoLocal } from '@/api/mode';
import { bootLocalDb, encerrarDemoLocal } from '@/db/bootstrap';
import type { Sessao } from '@/types/api';

const STORAGE_KEY = 'rankingplus.sessao';

type SessionValue = {
  sessao: Sessao | null;
  carregando: boolean;
  entrar: (s: Sessao) => Promise<void>;
  sair: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(async () => {
    // No-op barato se não havia demo; se havia, reaplica o seed (zera edições).
    try {
      await encerrarDemoLocal();
    } catch {
      /* best-effort — o bootLocalDb no próximo start também limpa */
    }
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setModoLocal(false);
    setAuth(null);
    setSessao(null);
  }, []);

  const entrar = useCallback(async (s: Sessao) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(s));
    setModoLocal(!!s.demo);
    setAuth(s.token);
    setSessao(s);
  }, []);

  // Start: prepara o SQLite local (seed + limpa demo órfão), restaura a sessão
  // salva e registra o handler de 401.
  useEffect(() => {
    let vivo = true;
    (async () => {
      setAuth(null, () => void sair());
      try {
        await bootLocalDb();
      } catch (e) {
        console.warn('[db] bootLocalDb falhou:', e);
      }
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw && vivo) {
          const s = JSON.parse(raw) as Sessao;
          setModoLocal(!!s.demo);
          setAuth(s.token, () => void sair());
          setSessao(s);
        }
      } catch {
        /* sem sessão salva */
      }
      if (vivo) setCarregando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [sair]);

  return (
    <SessionContext.Provider value={{ sessao, carregando, entrar, sair }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return ctx;
}
