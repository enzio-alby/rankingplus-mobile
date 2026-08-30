import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import * as local from '@/api_mobile';

async function comFallback<T>(viaApi: () => Promise<T>, viaLocal: () => Promise<T>): Promise<T> {
  if (modoLocal()) return viaLocal();
  try {
    return await viaApi();
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) return viaLocal();
    throw e;
  }
}

export function getQuestionarioAtivo() {
  return comFallback<local.QuestionarioAtivo>(
    () => apiFetch('/avaliacao/questionario/ativo'),
    () => local.questionarioAtivo(),
  );
}

export function getAvaliacaoComportamental(alunoId: number) {
  return comFallback<local.RespostaAvaliacao>(
    () => apiFetch(`/alunos/${alunoId}/avaliacao-comportamental`),
    () => local.avaliacaoComportamental(alunoId),
  );
}

/** Envia as respostas e recebe o perfil calculado. Sem fallback local — só com
 *  conta real (o cálculo e o versionamento acontecem no backend). */
export function enviarAvaliacaoComportamental(
  alunoId: number,
  respostas: { pergunta_id: number; opcao_id: number }[],
) {
  return apiFetch<{
    eixos: local.ResultadoComportamental['eixos'];
    perfis: local.ResultadoComportamental['perfis'];
    perfil_dominante: string;
    valido_ate: string;
  }>(`/alunos/${alunoId}/avaliacao-comportamental`, { method: 'POST', body: { respostas } });
}
