import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getPerfilProfessor, salvarPerfilProfessor, getStatsProfessor } from '@/api/professor';
import { Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function ProfPerfilScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['perfil-prof', id], queryFn: () => getPerfilProfessor(id) });
  const stats = useQuery({ queryKey: ['prof-stats', id], queryFn: () => getStatsProfessor(id) });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [titulacao, setTitulacao] = useState('');
  const [area, setArea] = useState('');
  const [editando, setEditando] = useState(false);

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
      setEditando(false);
      Alert.alert('Pronto', 'Perfil atualizado.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  const inicial = (q.data?.nome ?? sessao?.nome ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[colors.primary, '#241f52']}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{inicial}</Text>
        </View>
        <Text style={styles.nomeHead}>{q.data?.nome ?? sessao?.nome}</Text>
        <Text style={styles.emailHead}>{q.data?.email ?? ''}</Text>
        {q.data?.titulacao ? <Text style={styles.tit}>{q.data.titulacao}</Text> : null}

        {stats.data && (
          <View style={styles.statsRow}>
            <Mini valor={stats.data.turmas} rotulo="turmas" />
            <Mini valor={stats.data.alunos} rotulo="alunos" />
            <Mini valor={stats.data.media_geral ?? '—'} rotulo="média" />
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <Estado carregando={q.isLoading} erro={q.isError ? 'Erro ao carregar.' : null} onRetry={q.refetch} />

        {q.data && (
          <>
            <View style={styles.cardHead}>
              <Text style={styles.cardTit}>Dados</Text>
              <Pressable onPress={() => setEditando((v) => !v)}>
                <Text style={styles.editar}>{editando ? 'Cancelar' : 'Editar'}</Text>
              </Pressable>
            </View>

            {editando ? (
              <View style={styles.card}>
                <Campo label="Nome" value={nome} onChange={setNome} />
                <Campo label="Telefone" value={telefone} onChange={setTelefone} kb="phone-pad" />
                <Campo label="Titulação" value={titulacao} onChange={setTitulacao} />
                <Campo label="Área de atuação" value={area} onChange={setArea} />
                <Pressable
                  style={[styles.salvar, m.isPending && { opacity: 0.6 }]}
                  disabled={m.isPending}
                  onPress={() => m.mutate()}
                >
                  {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar</Text>}
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Linha icon="call" label="Telefone" valor={q.data.telefone} />
                <Linha icon="school" label="Titulação" valor={q.data.titulacao} />
                <Linha icon="briefcase" label="Área de atuação" valor={q.data.area_atuacao} />
                <Linha icon="time" label="Turno" valor={q.data.turno} />
                <Linha icon="location" label="Campus" valor={q.data.campus} />
              </View>
            )}

            <Pressable style={styles.linkRow} onPress={() => nav.navigate('Reportar')}>
              <Ionicons name="bug-outline" size={18} color={colors.textMuted} />
              <Text style={styles.linkTxt}>Reportar um problema</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => nav.navigate('Termos', { origem: 'app' })}>
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
              <Text style={styles.linkTxt}>Termos e privacidade</Text>
            </Pressable>
            <Pressable style={styles.linkRow} onPress={() => void sair()}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.linkTxt, { color: colors.danger }]}>Sair</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Mini({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniVal}>{valor}</Text>
      <Text style={styles.miniLbl}>{rotulo}</Text>
    </View>
  );
}

function Linha({
  icon, label, valor,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; valor: string | null }) {
  return (
    <View style={styles.dl}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ width: 22 }} />
      <Text style={styles.dt}>{label}</Text>
      <Text style={styles.dd}>{valor || '—'}</Text>
    </View>
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
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarTxt: { color: '#fff', fontSize: 26, fontWeight: '800' },
  nomeHead: { ...typography.h2, color: '#fff', textAlign: 'center' },
  emailHead: { ...typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  tit: { ...typography.tiny, color: colors.accent, marginTop: 4, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
  },
  mini: { alignItems: 'center' },
  miniVal: { ...typography.h3, color: '#fff' },
  miniLbl: { ...typography.tiny, color: 'rgba(255,255,255,0.7)' },
  body: { padding: spacing.md, gap: spacing.sm },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  cardTit: { ...typography.h3, color: colors.text },
  editar: { ...typography.small, color: colors.accent, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  dl: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  dt: { ...typography.small, color: colors.textMuted, width: 120 },
  dd: { ...typography.body, color: colors.text, flex: 1, textAlign: 'right' },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text,
  },
  salvar: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  salvarTxt: { ...typography.h3, color: '#fff' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  linkTxt: { ...typography.body, color: colors.textMuted },
});
