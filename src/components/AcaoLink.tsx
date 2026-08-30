import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, typography } from '@/theme/tokens';

/** Linha de ação (leva a outra tela). Substitui os links "apagados" com seta. */
export function AcaoLink({
  icon,
  label,
  descricao,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  descricao?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPress]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {!!descricao && <Text style={styles.desc}>{descricao}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPress: { backgroundColor: colors.surfaceAlt },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body, color: colors.text, fontWeight: '600' },
  desc: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
});
