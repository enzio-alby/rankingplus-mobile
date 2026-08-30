import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/auth/session';
import { criarVaga, atualizarVaga, getTiposVaga } from '@/api/empresa';
import { getAreasFoco } from '@/api/aluno';
import { ScreenScroll, Titulo, Card } from '@/components/ui';
import { SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VagaForm'>;

export function VagaFormScreen({ route }: Props) {
  const vaga = route.params?.vaga;
  const editando = !!vaga;
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const empresaId = sessao?.id ?? 0;

  const areas = useQuery({ queryKey: ['areas-foco'], queryFn: getAreasFoco });
  const tipos = useQuery({ queryKey: ['tipos-vaga'], queryFn: getTiposVaga });

  const [titulo, setTitulo] = useState(vaga?.titulo ?? '');
  const [descricao, setDescricao] = useState(vaga?.descricao ?? '');
  const [areaId, setAreaId] = useState<number | null>(vaga?.area_foco_id ?? null);
  const [tipoId, setTipoId] = useState<number | null>(vaga?.tipo_vaga_id ?? null);
  const [curso, setCurso] = useState(vaga?.curso_preferido ?? '');
  const [semestre, setSemestre] = useState(
    vaga?.semestre_minimo != null ? String(vaga.semestre_minimo) : '',
  );
  const [status, setStatus] = useState(vaga?.status ?? 'aberta');

  const m = useMutation({
    mutationFn: () => {
      const semNum = parseInt(semestre, 10);
      const campos = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        area_foco_id: areaId,
        tipo_vaga_id: tipoId,
        curso_preferido: curso.trim() || null,
        semestre_minimo: Number.isFinite(semNum) ? semNum : null,
        ...(editando ? { status } : {}),
      };
      return editando
        ? atualizarVaga(empresaId, vaga!.id, campos)
        : criarVaga(empresaId, campos);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vagas-emp'] });
      Alert.alert('Pronto', editando ? 'Vaga atualizada.' : 'Vaga publicada.');
      nav.goBack();
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  function salvar() {
    if (!titulo.trim()) {
      Alert.alert('Falta o título', 'A vaga precisa de um título.');
      return;
    }
    m.mutate();
  }

  const areaOpcoes = [
    { label: 'Não informada', value: null as string | null },
    ...(areas.data ?? []).map((a) => ({ label: a.nome, value: String(a.id) })),
  ];
  const tipoOpcoes = [
    { label: 'Não informado', value: null as string | null },
    ...(tipos.data ?? []).map((t) => ({ label: t.nome, value: String(t.id) })),
  ];

  return (
    <ScreenScroll>
      <Titulo>{editando ? 'Editar vaga' : 'Nova vaga'}</Titulo>

      <Card>
        <Campo label="Título *" value={titulo} onChange={setTitulo} />
        <Campo label="Descrição" value={descricao} onChange={setDescricao} multiline />

        <Text style={styles.label}>Área de foco</Text>
        <SelectPill
          label="Escolher área"
          value={areaId != null ? String(areaId) : null}
          options={areaOpcoes}
          onChange={(v) => setAreaId(v ? Number(v) : null)}
        />

        <Text style={styles.label}>Tipo de vaga</Text>
        <SelectPill
          label="Escolher tipo"
          value={tipoId != null ? String(tipoId) : null}
          options={tipoOpcoes}
          onChange={(v) => setTipoId(v ? Number(v) : null)}
        />

        <Campo label="Curso preferido" value={curso} onChange={setCurso} />
        <Campo label="Semestre mínimo" value={semestre} onChange={setSemestre} keyboard="number-pad" />

        {editando && (
          <>
            <Text style={styles.label}>Status</Text>
            <SelectPill
              label="Status"
              value={status}
              options={[
                { label: 'Aberta', value: 'aberta' },
                { label: 'Fechada', value: 'fechada' },
              ]}
              onChange={(v) => setStatus(v ?? 'aberta')}
            />
          </>
        )}
      </Card>

      <Pressable
        style={[styles.salvar, m.isPending && { opacity: 0.6 }]}
        disabled={m.isPending}
        onPress={salvar}
        accessibilityRole="button"
        accessibilityLabel={editando ? 'Salvar alterações da vaga' : 'Publicar vaga'}
      >
        {m.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.salvarTxt}>{editando ? 'Salvar' : 'Publicar vaga'}</Text>
        )}
      </Pressable>
    </ScreenScroll>
  );
}

function Campo({
  label, value, onChange, multiline, keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboard?: 'default' | 'number-pad';
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard ?? 'default'}
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  salvar: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.lg,
  },
  salvarTxt: { ...typography.h3, color: '#fff' },
});
