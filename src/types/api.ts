/** Tipos compartilhados espelhando o backend `api2.js`. Subconjunto inicial —
 *  cresce conforme as telas forem portadas. */

export type Papel = 'aluno' | 'professor' | 'empresa';

export type Sessao = {
  id: number;
  nome: string;
  tipo: Papel;
  token: string;
  /** presente só quando a sessão é um usuário de demonstração efêmero */
  demo?: {
    modo: Papel;
    expiraEm: string; // ISO
  };
};

export type LoginResponse = {
  sucesso: true;
  requerOTP: true;
  tempToken: string;
  emailMascarado: string;
};

export type VerificarOtpResponse = {
  sucesso: true;
  token: string;
  usuario: { id: number; nome: string; tipo: Papel };
  precisaReaceitarTermos?: boolean;
};

/** Resposta de POST /demo/iniciar (rota nova a implementar no backend). */
export type DemoIniciarResponse = {
  id: number;
  nome: string;
  tipo: Papel;
  token: string;
  expiraEm: string;
};

export type Metricas = {
  media_geral: number | string | null;
  total_atividades: number;
  total_faltas: number;
  frequencia?: number;
};
