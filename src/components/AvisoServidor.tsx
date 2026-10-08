import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServidorForaDoAr } from '@/api/status';
import { SUPORTE_EMAIL, abrirEmailSuporte } from '@/lib/suporte';
import { colors, spacing, typography } from '@/theme/tokens';

/** Faixa exibida no topo do app quando o servidor de produção está fora do ar. */
export function AvisoServidor() {
  const foraDoAr = useServidorForaDoAr();
  const insets = useSafeAreaInsets();
  if (!foraDoAr) return null;

  return (
    <View style={[styles.faixa, { paddingTop: insets.top + spacing.sm }]} accessibilityRole="alert">
      <Text style={styles.texto}>
        O servidor de produção está fora do ar. Você está usando os dados locais do aparelho, que
        podem estar desatualizados.
      </Text>
      <Pressable
        onPress={() => void abrirEmailSuporte('Servidor fora do ar')}
        style={styles.botao}
        accessibilityRole="link"
        accessibilityLabel={`Enviar e-mail para o suporte ${SUPORTE_EMAIL}`}
      >
        <Text style={styles.link}>Suporte: {SUPORTE_EMAIL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  texto: { ...typography.small, color: colors.text },
  botao: { minHeight: 44, justifyContent: 'center' },
  link: { ...typography.small, color: colors.warning, fontWeight: '700', textDecorationLine: 'underline' },
});
