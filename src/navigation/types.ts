import type { Papel } from '@/types/api';

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
  // sempre disponível
  Termos: { origem: 'inicial' | 'app' } | undefined;
};

/** @deprecated use RootStackParamList */
export type AuthStackParamList = RootStackParamList;
