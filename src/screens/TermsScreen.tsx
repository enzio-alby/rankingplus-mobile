import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Termos de Uso + Aviso. Acessível pra qualquer pessoa: link na tela inicial
 * (antes de logar) e dentro do app (demo ou logado de verdade).
 * Texto final: enxugar o de `../RANKING+/html/termodeuso.html` (checklist FRONT).
 */
export function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + spacing.lg }]}
    >
      <Text style={styles.h}>Termos de Uso e Privacidade</Text>

      <Text style={styles.h2}>Modo demonstração</Text>
      <Text style={styles.p}>
        Ao entrar com Google e escolher um modo de demonstração, o app cria um
        perfil temporário derivado de um perfil de referência. Os dados exibidos
        são fictícios ou de demonstração, ficam apenas neste aparelho, podem ser
        editados livremente e são apagados quando você sai ou fecha o app. Nada
        é enviado a recrutadores, empresas ou terceiros reais.
      </Text>

      <Text style={styles.h2}>Finalidade</Text>
      <Text style={styles.p}>
        O Ranking+ é um projeto acadêmico (Projeto Integrador IV — UniCEUB). O
        uso de dados pessoais, quando houver login real, segue a LGPD (Lei
        13.709/2018): finalidade acadêmica, sem decisão automatizada sem revisão
        humana, com direito de acesso e exclusão.
      </Text>

      <Text style={styles.h2}>Contato</Text>
      <Text style={styles.p}>admin.rankingplus@gmail.com</Text>

      <Text style={styles.rodape}>
        Versão resumida para o app. Termos completos na plataforma web.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl },
  h: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  h2: { ...typography.h3, color: colors.text, marginTop: spacing.lg },
  p: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  rodape: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xl },
});
