import { apiFetch, ApiError } from '@/api/client';
import { modoLocal } from '@/api/mode';
import type { LoginResponse, Papel, VerificarOtpResponse } from '@/types/api';

// ─── Login por e-mail + OTP (aluno / professor) ─────────────────────────────
export function login(tipoUsuario: Papel, identificador: string, senha: string) {
  return apiFetch<LoginResponse>('/login', {
    method: 'POST',
    publica: true,
    body: { tipoUsuario, identificador, senha },
  });
}

export function verificarOtp(tempToken: string, codigo: string) {
  return apiFetch<VerificarOtpResponse>('/verificar-otp', {
    method: 'POST',
    publica: true,
    body: { tempToken, codigo },
  });
}

export function reenviarOtp(tempToken: string) {
  return apiFetch<{ sucesso: boolean; mensagem: string }>('/reenviar-otp', {
    method: 'POST',
    publica: true,
    body: { tempToken },
  });
}

// ─── Login de empresa (sem OTP — o backend emite a sessão direto) ───────────
export function loginEmpresa(email: string, senha: string) {
  return apiFetch<{
    sucesso: true;
    token: string;
    empresa: { id: number; nome_fantasia?: string; razao_social?: string };
  }>('/empresas/login', {
    method: 'POST',
    publica: true,
    body: { email, senha },
  });
}

// ─── Recuperação de senha (só por e-mail; a redefinição termina no site) ────
export async function solicitarRecuperacaoSenha(email: string): Promise<string> {
  if (modoLocal()) throw new Error('Indisponível no modo demonstração.');
  try {
    const r = await apiFetch<{ sucesso: boolean; mensagem: string }>('/recuperar-senha/solicitar', {
      method: 'POST',
      publica: true,
      body: { email },
    });
    return r.mensagem;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 0) throw new Error('Sem conexão com o servidor. Confira sua internet e tente de novo. Suporte: admin.rankingplus@gmail.com');
      if (e.status === 429) {
        throw new Error('Muitas tentativas. Aguarde cerca de 15 minutos e tente novamente.');
      }
      if (e.status === 400) throw new Error('E-mail inválido. Confira o endereço digitado.');
    }
    throw e;
  }
}
