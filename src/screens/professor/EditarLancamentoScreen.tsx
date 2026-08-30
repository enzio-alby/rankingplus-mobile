import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { salvarLancamento } from '@/api/professor';
import { ScreenScroll, Titulo, Card } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'EditarLancamento'>;

const MENCOES = ['SS', 'MS', 'MM', 'MI', 'II', 'SR'];

export function EditarLancamentoScreen({ route, navigation }: Props) {
  const qc = useQueryClient();
  const { profId, discId, alunoId, nome, atual } = route.params;

  const [mencao, setMencao] = useState<string | null>(atual.mencao);
  const [faltas, setFaltas] = useState(String(atual.faltas ?? ''));
  const [nota, setNota] = useState(atual.nota_avaliacao != null ? String(atual.nota_avaliacao) : '');
  const [ativ, setAtiv] = useState(String(atual.atividades_entregues ?? ''));

  const m = useMutation({
    mutationFn: () =>
      salvarLancamento(profId, discId, alunoId, {
        mencao: mencao ?? undefined,
        faltas: faltas === '' ? undefined : Number(faltas),
        nota_avaliacao: nota === '' ? null : Number(nota),
        atividades_entregues: ativ === '' ? undefined : Number(ativ),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turma-alunos', profId, discId] });
      qc.invalidateQueries({ queryKey: ['prof-stats'] });
      qc.invalidateQueries({ queryKey: ['prof-dstats'] });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  return (
    <ScreenScroll>
      <Titulo>Lançamento</Titulo>
      <Text style={styles.aluno}>{nome}</Text>

      <Card>
        <Text style={styles.label}>Menção</Text>
        <View style={styles.mencoes}>
          {MENCOES.map((mn) => (
            <Pressable
              key={mn}
              style={[styles.mBtn, mencao === mn && styles.mBtnOn]}
              onPress={() => setMencao(mn)}
            >
              <Text style={[styles.mBtnTxt, mencao === mn && styles.mBtnTxtOn]}>{mn}</Text>
            </Pressable>
          ))}
        </View>

        <Campo label="Faltas" value={faltas} onChange={setFaltas} />
        <Campo label="Nota da avaliação (0–10)" value={nota} onChange={setNota} />
        <Campo label="Atividades entregues" value={ativ} onChange={setAtiv} />
      </Card>

      <Pressable style={[styles.salvar, m.isPending && { opacity: 0.6 }]} disabled={m.isPending} onPress={() => m.mutate()}>
        {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar lançamento</Text>}
      </Pressable>
      <Pressable style={styles.cancelar} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelarTxt}>Cancelar</Text>
      </Pressable>
    </ScreenScroll>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => onChange(t.replace(',', '.'))}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  aluno: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 },
  mencoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minWidth: 46, alignItems: 'center',
  },
  mBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  mBtnTxt: { ...typography.body, color: colors.text, fontWeight: '700' },
  mBtnTxtOn: { color: '#fff' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text,
  },
  salvar: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg,
  },
  salvarTxt: { ...typography.h3, color: '#fff' },
  cancelar: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelarTxt: { ...typography.body, color: colors.textMuted },
});
