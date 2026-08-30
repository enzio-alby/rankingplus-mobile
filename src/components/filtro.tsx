import React, { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export type Opcao = { label: string; value: string | null };

/** Barra horizontal de filtros (pills roláveis). */
export function FiltroBar({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
    >
      {children}
    </ScrollView>
  );
}

/** Pill que abre uma folha com opções. `value=null` = "todos". */
export function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: Opcao[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ativo = value != null && value !== '';
  const atual = options.find((o) => o.value === value);

  return (
    <>
      <Pressable style={[styles.pill, ativo && styles.pillOn]} onPress={() => setOpen(true)}>
        <Text style={[styles.pillTxt, ativo && styles.pillTxtOn]} numberOfLines={1}>
          {ativo ? atual?.label ?? label : label}
        </Text>
        <Text style={[styles.chev, ativo && styles.pillTxtOn]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitulo}>{label}</Text>
            <ScrollView>
              {options.map((o, i) => (
                <Pressable
                  key={i}
                  style={styles.opt}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optTxt, o.value === value && styles.optTxtOn]}>{o.label}</Text>
                  {o.value === value && <Text style={styles.check}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    maxWidth: 200,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillTxt: { ...typography.small, color: colors.text },
  pillTxtOn: { color: '#fff', fontWeight: '600' },
  chev: { fontSize: 10, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  sheetTitulo: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  opt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optTxt: { ...typography.body, color: colors.text },
  optTxtOn: { color: colors.primary, fontWeight: '700' },
  check: { color: colors.primary, fontWeight: '700' },
});
