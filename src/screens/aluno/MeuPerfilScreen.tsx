import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Switch, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getMeuPerfil, salvarMeuPerfil, getDashboard } from '@/api/aluno';
import { Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function MeuPerfilScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['meu-perfil', id], queryFn: () => getMeuPerfil(id) });
  // Mesma queryKey do Dashboard — reaproveita o cache em vez de refazer as 3 chamadas.
  const dash = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id) });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [ranking, setRanking] = useState(true);
  const [editando, setEditando] = useState(false);

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
      setEditando(false);
      Alert.alert('Pronto', 'Perfil atualizado.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  const inicial = (q.data?.nome ?? sessao?.nome ?? '?')[0]?.toUpperCase() ?? '?';
  const pos = dash.data?.posicao_ranking;

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
        {q.data?.curso ? (
          <Text style={styles.tit}>
            {q.data.curso}
            {q.data.semestre_atual ? ` · ${q.data.semestre_atual}º sem.` : ''}
          </Text>
        ) : null}

        {dash.data && (
          <View style={styles.statsRow}>
            <Mini valor={dash.data.media_geral ?? '—'} rotulo="média" />
            <Mini valor={pos ? `${pos}º` : '—'} rotulo="ranking" />
            <Mini valor={`${Math.round(dash.data.frequencia)}%`} rotulo="presença" />
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching || dash.isRefetching}
            onRefresh={() => {
              q.refetch();
              dash.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Estado carregando={q.isLoading} erro={q.isError ? 'Erro ao carregar perfil.' : null} onRetry={q.refetch} />

        {q.data && (
          <>
            <View style={styles.cardHead}>
              <Text style={styles.cardTit}>Dados</Text>
              <Pressable
                onPress={() => setEditando((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={editando ? 'Cancelar edição do perfil' : 'Editar perfil'}
              >
                <Text style={styles.editar}>{editando ? 'Cancelar' : 'Editar'}</Text>
              </Pressable>
            </View>

            {editando ? (
              <View style={styles.card}>
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

                <Pressable
                  style={[styles.salvar, m.isPending && { opacity: 0.6 }]}
                  disabled={m.isPending}
                  onPress={() => m.mutate()}
                  accessibilityRole="button"
                  accessibilityLabel="Salvar perfil"
                  accessibilityState={{ disabled: m.isPending, busy: m.isPending }}
                >
                  {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar</Text>}
                </Pressable>
              </View>
            ) : (
              <View style={styles.card}>
                <Linha icon="call" label="Telefone" valor={q.data.telefone} />
                <Linha icon="logo-github" label="GitHub" valor={q.data.github} />
                <Linha icon="logo-linkedin" label="LinkedIn" valor={q.data.linkedin} />
                <Linha
                  icon="eye"
                  label="Ranking público"
                  valor={Number(q.data.permitir_exibicao_ranking) === 1 ? 'Sim' : 'Anônimo'}
                />
              </View>
            )}

            <Pressable
              style={styles.linkRow}
              onPress={() => nav.navigate('PerfilAts')}
              accessibilityRole="button"
              accessibilityLabel="Abrir currículo e perfil profissional"
            >
              <Ionicons name="briefcase-outline" size={18} color={colors.textMuted} />
              <Text style={styles.linkTxt}>Currículo / Perfil profissional</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </Pressable>
            <Pressable
              style={styles.linkRow}
              onPress={() => nav.navigate('Termos', { origem: 'app' })}
              accessibilityRole="link"
              accessibilityLabel="Abrir termos e privacidade"
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
              <Text style={styles.linkTxt}>Termos e privacidade</Text>
            </Pressable>
            <Pressable
              style={styles.linkRow}
              onPress={() => void sair()}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.linkTxt, { color: colors.danger }]}>Sair</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
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
      <Text style={styles.dd} numberOfLines={1}>{valor || '—'}</Text>
    </View>
  );
}

function Campo({
  label, value, onChange, keyboard,
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
  body: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
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
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  toggleTit: { ...typography.body, color: colors.text, fontWeight: '600' },
  toggleSub: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  salvar: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  salvarTxt: { ...typography.h3, color: '#fff' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  linkTxt: { ...typography.body, color: colors.textMuted },
});
