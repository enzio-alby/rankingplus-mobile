import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Switch, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getMeuPerfil, salvarMeuPerfil } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function MeuPerfilScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['meu-perfil', id], queryFn: () => getMeuPerfil(id) });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [ranking, setRanking] = useState(true);

  useEffect(() => {
    if (q.data) {
      setNome(q.data.nome ?? '');
      setTelefone(q.data.telefone ?? '');
      setGithub(q.data.github ?? '');
      setLinkedin(q.data.linkedin ?? '');
      setRanking(Number(q.data.permitir_exibicao_ranking) === 1);
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () =>
      salvarMeuPerfil(id, {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        github: github.trim() || null,
        linkedin: linkedin.trim() || null,
        permitir_exibicao_ranking: ranking ? 1 : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meu-perfil', id] });
      qc.invalidateQueries({ queryKey: ['ranking'] });
      Alert.alert('Pronto', 'Perfil atualizado.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.top}>
        <Titulo>Meu Perfil</Titulo>
        <Pressable onPress={() => void sair()} style={styles.sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </Pressable>
      </View>

      <Estado carregando={q.isLoading} erro={q.isError ? 'Erro ao carregar perfil.' : null} onRetry={q.refetch} />

      {q.data && (
        <>
          <Card>
            <Text style={styles.readonly}>
              {q.data.email} · {q.data.curso ?? '—'}
              {q.data.semestre_atual ? ` · ${q.data.semestre_atual}º sem.` : ''}
            </Text>

            <Campo label="Nome" value={nome} onChange={setNome} />
            <Campo label="Telefone" value={telefone} onChange={setTelefone} keyboard="phone-pad" />
            <Campo label="GitHub (URL)" value={github} onChange={setGithub} />
            <Campo label="LinkedIn (URL)" value={linkedin} onChange={setLinkedin} />

            <View style={styles.toggle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTit}>Aparecer no ranking público</Text>
                <Text style={styles.toggleSub}>
                  {ranking ? 'Seu nome aparece pra empresas.' : 'Você aparece como “Aluno Anônimo”.'}
                </Text>
              </View>
              <Switch value={ranking} onValueChange={setRanking} />
            </View>
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
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'default' | 'phone-pad';
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        keyboardType={keyboard ?? 'default'}
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sair: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sairTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  readonly: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  toggleTit: { ...typography.body, color: colors.text, fontWeight: '600' },
  toggleSub: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  salvar: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  salvarTxt: { ...typography.h3, color: '#fff' },
  termos: { paddingVertical: spacing.lg, alignItems: 'center' },
  termosTxt: { ...typography.small, color: colors.textMuted },
});
