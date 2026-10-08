import { Alert, Linking } from 'react-native';

export const SUPORTE_EMAIL = 'admin.rankingplus@gmail.com';

/** Abre o app de e-mail do aparelho com o endereço de suporte preenchido. */
export async function abrirEmailSuporte(assunto = 'Suporte Ranking+'): Promise<void> {
  const url = `mailto:${SUPORTE_EMAIL}?subject=${encodeURIComponent(assunto)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir o e-mail', `Escreva para ${SUPORTE_EMAIL}.`);
  }
}
