import type { Papel } from '@/types/api';
import type { VagaEmpresa } from '@/api_mobile';

/** Rotas do stack raiz (auth + app). As telas usam este tipo em
 *  `NativeStackScreenProps<RootStackParamList, 'X'>`. */
export type RootStackParamList = {
  // sem sessão
  Splash: undefined;
  DemoSelect: { nomeGoogle: string; emailGoogle: string };
  LoginEmail: undefined;
  Otp: { tempToken: string; emailMascarado: string; tipo: Papel };
  // com sessão
  Main: undefined;
  EditarLancamento: {
    profId: number;
    discId: number;
    alunoId: number;
    nome: string;
    atual: {
      mencao: string | null;
      faltas: number | null;
      nota_avaliacao: number | null;
      atividades_entregues: number | null;
    };
  };
  Conversa: {
    conversaId: number;
    nome: string;
    outroTipo?: string;
    outroId?: number;
  };
  Notificacoes: undefined;
  Relatorios: undefined;
  ProfRelatorios: undefined;
  Talentos: undefined;
  PerfilAts: undefined;
  PerfilComportamental: undefined;
  RelatorioPreview: { alunoId: number; nome: string };
  NovaConversa: undefined;
  VagaForm: { vaga?: VagaEmpresa } | undefined;
  // sempre disponível
  Termos: { origem: 'inicial' | 'app' } | undefined;
  Sobre: undefined;
};

/** @deprecated use RootStackParamList */
export type AuthStackParamList = RootStackParamList;
