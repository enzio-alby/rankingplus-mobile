import CryptoJS from 'crypto-js';
import { SEED_KEY } from '@/config';
import { SEED_ENC, SEED_GERADO_EM } from '@/db/seed-data';

export type SeedDump = {
  geradoEm: string;
  tabelas: Record<string, Record<string, unknown>[]>;
};

/**
 * Decifra o snapshot do banco (`src/db/seed-data.ts`, gerado por
 * `scripts/export-seed.js`). Mesma lib e mesma chave dos dois lados
 * (`crypto-js` AES, formato OpenSSL/CBC). Ver nota no vault: a chave é
 * ofuscação, não cofre — decisão consciente pra app acadêmico.
 */
export function decifrarSeed(): SeedDump {
  const json = CryptoJS.AES.decrypt(SEED_ENC, SEED_KEY).toString(
    CryptoJS.enc.Utf8,
  );
  if (!json) throw new Error('Falha ao decifrar o seed (chave errada?).');
  const dump = JSON.parse(json) as SeedDump;
  return dump;
}

export const SEED_VERSAO = SEED_GERADO_EM;
