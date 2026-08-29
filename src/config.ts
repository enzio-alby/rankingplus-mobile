import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
  seedKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/**
 * URL base da API. Vem de `expo.extra.apiUrl` no app.json (IP de LAN do Laragon)
 * e pode ser sobrescrita por `EXPO_PUBLIC_API_URL` em desenvolvimento.
 * Quando o modo offline (SQLite local) estiver pronto, o app cai pra ele se
 * esta URL falhar.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://SEU_IP_LOCAL:4000';

/**
 * OAuth do Google (login "Entrar com Google" pedido pelo professor).
 * Projeto no Google Cloud Console: "Ranking Plus PI4" / conta admin.rankingplus@gmail.com.
 * O Web client já existe; Android/iOS entram na Fase 2 (precisam do SHA-1 do EAS).
 * Client IDs NÃO são segredo (são públicos por design) — ok ficar no app.json.
 */
export const GOOGLE = {
  webClientId: extra.googleWebClientId ?? '',
  androidClientId: extra.googleAndroidClientId ?? '',
  iosClientId: extra.googleIosClientId ?? '',
};

/**
 * Chave usada pra cifrar/decifrar o seed do banco local (`src/db/seed-data.ts`).
 * NÃO é segredo forte — vai embutida no build; é ofuscação, não cofre. Decisão
 * consciente pra um app acadêmico (ver nota no vault). O `scripts/export-seed.js`
 * usa a MESMA chave (via env `SEED_KEY` ou este default).
 */
export const SEED_KEY =
  extra.seedKey ?? 'rankingplus-p4-seed-2026-uniceub-pi4-key';

/** TTL local de sessão demo, só pra UI avisar; a limpeza real é no bootstrap. */
export const DEMO_TTL_HORAS = 6;
