import React, { type ReactNode, forwardRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export const ScreenScroll = forwardRef<
  ScrollView,
  { children: ReactNode; onRefresh?: () => void; refreshing?: boolean }
>(function ScreenScroll({ children, onRefresh, refreshing }, ref) {
  // As telas de aba já têm o header nativo (com o sino), então aqui só um respiro.
  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ backgroundColor: colors.bgMuted }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxl,
        gap: spacing.sm,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
});

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={styles.titulo}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Loading / erro / vazio num componente só. */
export function Estado({
  carregando,
  erro,
  vazio,
  vazioTexto = 'Nada por aqui ainda.',
  onRetry,
}: {
  carregando?: boolean;
  erro?: string | null;
  vazio?: boolean;
  vazioTexto?: string;
  onRetry?: () => void;
}) {
  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erroTxt}>{erro}</Text>
        {onRetry && (
          <Pressable style={styles.btn} onPress={onRetry}>
            <Text style={styles.btnTxt}>Tentar de novo</Text>
          </Pressable>
        )}
      </View>
    );
  }
  if (vazio) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazioTxt}>{vazioTexto}</Text>
      </View>
    );
  }
  return null;
}

export function StatTile({
  valor,
  rotulo,
  cor,
}: {
  valor: string | number;
  rotulo: string;
  cor?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statVal, cor ? { color: cor } : null]}>{valor}</Text>
      <Text style={styles.statLbl}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { ...typography.h2, color: colors.text, marginTop: spacing.xs, marginBottom: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#0b1220',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  erroTxt: { ...typography.body, color: colors.danger, textAlign: 'center' },
  vazioTxt: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  btnTxt: { ...typography.body, color: '#fff', fontWeight: '600' },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statVal: { ...typography.h2, color: colors.primary },
  statLbl: { ...typography.tiny, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
});
