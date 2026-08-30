import type { OpcoesDesempenho } from '@/api_mobile';

/** Opções do filtro de período do gráfico "Evolução das notas" — mesma
 *  semântica de `?filtro=` / `?agrupar=ano` da rota do backend. */
export const PERIODOS_DESEMPENHO: Record<string, { label: string; opts: OpcoesDesempenho }> = {
  semestral: { label: 'Recente (2 sem.)', opts: { periodo: 'semestral' } },
  anual: { label: 'Anual (4 sem.)', opts: { periodo: 'anual' } },
  completo: { label: 'Tudo', opts: { periodo: 'completo' } },
  ano: { label: 'Por ano', opts: { periodo: 'anual', porAno: true } },
};

export const PERIODO_PADRAO = 'completo';
