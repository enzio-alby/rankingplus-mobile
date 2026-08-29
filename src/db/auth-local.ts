import bcrypt from 'bcryptjs';
import { first } from '@/db/local';
import type { Papel, Sessao } from '@/types/api';

/**
 * Verificação de senha igual à do backend (`_verificarSenha` em api2.js):
 * hash bcrypt se começa com `$2`, senão comparação de texto puro (contas legadas).
 */
export function verificarSenha(digitada: string, noBanco: string): boolean {
  if (typeof noBanco !== 'string') return false;
  if (noBanco.startsWith('$2')) {
    try {
      return bcrypt.compareSync(digitada, noBanco);
    } catch {
      return false;
    }
  }
  return digitada === noBanco;
}

/** Login offline contra o SQLite local (usado quando não há rede). */
export async function loginLocal(
  tipo: Papel,
  identificador: string,
  senha: string,
): Promise<Sessao> {
  const tabela = tipo === 'aluno' ? 'alunos' : tipo === 'professor' ? 'professores' : 'empresas';
  const campoEmail = tipo === 'empresa' ? 'email_corporativo' : 'email';
  const campoNome = tipo === 'empresa' ? 'nome_fantasia' : 'nome';

  const row = await first<Record<string, unknown>>(
    `SELECT id, "${campoNome}" AS nome, senha FROM "${tabela}"
       WHERE "${campoEmail}" = ? ${tipo === 'aluno' ? 'OR matricula = ?' : ''} LIMIT 1`,
    tipo === 'aluno' ? [identificador, identificador] : [identificador],
  );

  if (!row || !verificarSenha(senha, String(row.senha))) {
    throw new Error('Credenciais inválidas (modo offline).');
  }
  return {
    id: Number(row.id),
    nome: String(row.nome ?? ''),
    tipo,
    token: `local-${tipo}-${row.id}`,
  };
}
