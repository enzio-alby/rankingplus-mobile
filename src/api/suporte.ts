import { apiFetch } from '@/api/client';

/**
 * Abre um chamado de suporte (bug/erro) — rota pública do web
 * (`POST /suporte/chamados`, sem token): grava em `chamados_suporte` e dispara
 * e-mail pra admin.rankingplus@gmail.com. Funciona tanto na demo quanto logado.
 */
export function enviarReporte(dados: {
  nome: string;
  email: string;
  assunto: string;
  descricao: string;
}) {
  return apiFetch<{ id: number; mensagem: string }>('/suporte/chamados', {
    method: 'POST',
    publica: true,
    body: {
      nome: dados.nome.trim() || 'Testador do app',
      email: dados.email.trim(),
      categoria: 'technical',
      prioridade: 'medium',
      assunto: dados.assunto.trim() || 'Report do app mobile',
      descricao: dados.descricao.trim(),
      origem: 'formulario',
    },
  });
}
