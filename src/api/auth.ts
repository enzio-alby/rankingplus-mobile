import { apiFetch } from '@/api/client';
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
