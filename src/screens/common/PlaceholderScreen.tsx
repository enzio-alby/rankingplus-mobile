import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { colors, spacing, radius, typography } from '@/theme/tokens';

/** Tela genérica "em construção" — cada rota do checklist aponta pra cá até
 *  ser implementada de verdade. Mostra o modo demo ativo e permite sair. */
export function PlaceholderScreen({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();
  const { sessao, sair } = useSession();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.h}>{titulo}</Text>
      <Text style={styles.badge}>
        {sessao?.demo ? `modo ${sessao.demo.modo} · ${sessao?.nome}` : sessao?.nome}
      </Text>
      <Text style={styles.p}>Tela em construção — ver checklist no vault.</Text>

      <Pressable
        style={styles.termos}
        onPress={() => navigation.navigate('Termos', { origem: 'app' })}
      >
        <Text style={styles.termosText}>Termos e privacidade</Text>
      </Pressable>

      <Pressable style={styles.sair} onPress={() => void sair()}>
        <Text style={styles.sairText}>Sair</Text>
      </Pressable>
    </View>
  );
}

export const makePlaceholder = (titulo: string) => () =>
  <PlaceholderScreen titulo={titulo} />;

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.sm },
  h: { ...typography.h1, color: colors.text },
  badge: { ...typography.tiny, color: colors.accent },
  p: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  termos: { marginTop: 'auto', paddingVertical: spacing.sm, alignItems: 'center' },
  termosText: { ...typography.small, color: colors.textMuted },
  sair: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sairText: { ...typography.body, color: colors.danger, fontWeight: '600' },
});
