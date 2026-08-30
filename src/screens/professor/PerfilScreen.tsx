import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getPerfilProfessor, salvarPerfilProfessor } from '@/api/professor';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function ProfPerfilScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['perfil-prof', id], queryFn: () => getPerfilProfessor(id) });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [titulacao, setTitulacao] = useState('');
  const [area, setArea] = useState('');

  useEffect(() => {
    if (q.data) {
      setNome(q.data.nome ?? '');
      setTelefone(q.data.telefone ?? '');
      setTitulacao(q.data.titulacao ?? '');
      setArea(q.data.area_atuacao ?? '');
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () =>
      salvarPerfilProfessor(id, {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        titulacao: titulacao.trim() || null,
        area_atuacao: area.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil-prof', id] });
      Alert.alert('Pronto', 'Perfil atualizado.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.topo}>
        <Titulo>Perfil</Titulo>
        <Pressable onPress={() => void sair()} style={styles.sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </Pressable>
      </View>
      <Estado carregando={q.isLoading} erro={q.isError ? 'Erro ao carregar.' : null} onRetry={q.refetch} />

      {q.data && (
        <>
          <Card>
            <Text style={styles.readonly}>{q.data.email}</Text>
            <Campo label="Nome" value={nome} onChange={setNome} />
            <Campo label="Telefone" value={telefone} onChange={setTelefone} kb="phone-pad" />
            <Campo label="Titulação" value={titulacao} onChange={setTitulacao} />
            <Campo label="Área de atuação" value={area} onChange={setArea} />
          </Card>
          <Pressable style={[styles.salvar, m.isPending && { opacity: 0.6 }]} disabled={m.isPending} onPress={() => m.mutate()}>
            {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar</Text>}
          </Pressable>
        </>
      )}

      <Pressable style={styles.termos} onPress={() => nav.navigate('Termos', { origem: 'app' })}>
        <Text style={styles.termosTxt}>Termos e privacidade</Text>
      </Pressable>
    </ScreenScroll>
  );
}

function Campo({
  label, value, onChange, kb,
}: { label: string; value: string; onChange: (v: string) => void; kb?: 'default' | 'phone-pad' }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={kb ?? 'default'}
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sair: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sairTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  readonly: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text,
  },
  salvar: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  salvarTxt: { ...typography.h3, color: '#fff' },
  termos: { paddingVertical: spacing.lg, alignItems: 'center' },
  termosTxt: { ...typography.small, color: colors.textMuted },
});
