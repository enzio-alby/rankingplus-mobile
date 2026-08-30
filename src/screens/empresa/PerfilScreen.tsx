import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import {
  getInteressesEmpresa,
  salvarInteressesEmpresa,
  getVagasEmpresa,
  getFavoritos,
  getContratacoes,
  getTiposVaga,
} from '@/api/empresa';
import { getAreasFoco } from '@/api/aluno';
import { PERFIS_COMPORTAMENTAIS, STATUS_FAVORITO } from '@/api_mobile';
import { Estado } from '@/components/ui';
import { SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const ROTULO_PERFIL: Record<string, string> = {
  executor: 'Executor',
  comunicador: 'Comunicador',
  planejador: 'Planejador',
  analista: 'Analista',
};

const FUNIL: { chave: string; rotulo: string; cor: string }[] = [
  { chave: 'novo', rotulo: 'Novos', cor: colors.textMuted },
  { chave: 'contatado', rotulo: 'Contatados', cor: colors.primary },
  { chave: 'entrevista_marcada', rotulo: 'Entrevista', cor: colors.warning },
  { chave: 'contratado', rotulo: 'Contratados', cor: colors.success },
  { chave: 'descartado', rotulo: 'Descartados', cor: colors.danger },
];

export function EmpPerfilScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;

  const q = useQuery({ queryKey: ['emp-interesses', id], queryFn: () => getInteressesEmpresa(id) });
  const areas = useQuery({ queryKey: ['areas-foco'], queryFn: getAreasFoco });
  const tipos = useQuery({ queryKey: ['tipos-vaga'], queryFn: getTiposVaga });
  const vagas = useQuery({ queryKey: ['vagas-emp', id], queryFn: () => getVagasEmpresa(id) });
  const favs = useQuery({ queryKey: ['favoritos', id], queryFn: () => getFavoritos(id) });
  const contr = useQuery({ queryKey: ['contratacoes', id], queryFn: () => getContratacoes(id) });

  const [editando, setEditando] = useState(false);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [curso, setCurso] = useState('');
  const [semestre, setSemestre] = useState('');
  const [perfis, setPerfis] = useState<string[]>([]);

  useEffect(() => {
    if (!q.data) return;
    setAreaId(q.data.area_foco_id);
    setTipoId(q.data.tipo_vaga_id);
    setCurso(q.data.curso_preferido ?? '');
    setSemestre(q.data.semestre_minimo != null ? String(q.data.semestre_minimo) : '');
    setPerfis([...q.data.perfis_procurados]);
  }, [q.data]);

  const m = useMutation({
    mutationFn: () => {
      const sem = parseInt(semestre, 10);
      return salvarInteressesEmpresa(id, {
        area_foco_id: areaId,
        tipo_vaga_id: tipoId,
        curso_preferido: curso.trim() || null,
        semestre_minimo: Number.isFinite(sem) ? sem : null,
        perfis_procurados: perfis,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp-interesses', id] });
      qc.invalidateQueries({ queryKey: ['talentos'] });
      setEditando(false);
      Alert.alert('Pronto', 'Interesses atualizados.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  function togglePerfil(p: string) {
    setPerfis((atual) =>
      atual.includes(p) ? atual.filter((x) => x !== p) : atual.length >= 2 ? atual : [...atual, p],
    );
  }

  const inicial = (sessao?.nome ?? '?')[0]?.toUpperCase() ?? '?';
  const vagasAbertas = (vagas.data ?? []).filter((v) => v.status === 'aberta').length;

  const areaNome =
    (areas.data ?? []).find((a) => a.id === areaId)?.nome ??
    (areaId === q.data?.area_foco_id ? q.data?.area_foco_nome : null);
  const tipoNome =
    (tipos.data ?? []).find((t) => t.id === tipoId)?.nome ??
    (tipoId === q.data?.tipo_vaga_id ? q.data?.tipo_vaga_nome : null);

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[colors.primary, '#241f52']}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{inicial}</Text>
        </View>
        <Text style={styles.nomeHead}>{sessao?.nome}</Text>
        {sessao?.demo && <Text style={styles.demo}>modo demonstração</Text>}
        <View style={styles.statsRow}>
          <Mini valor={vagasAbertas} rotulo="vagas abertas" />
          <Mini valor={favs.data?.length ?? 0} rotulo="favoritos" />
          <Mini valor={contr.data?.length ?? 0} rotulo="contratações" />
        </View>
      </LinearGradient>

      <ScrollBody>
        {/* ── Interesses de Perfil ── */}
        <View style={styles.cardHead}>
          <Text style={styles.cardTit}>Interesses de Perfil</Text>
          {q.data && (
            <Pressable
              onPress={() => setEditando((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={editando ? 'Cancelar edição' : 'Editar interesses'}
            >
              <Text style={styles.editar}>{editando ? 'Cancelar' : 'Editar'}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.hint}>O perfil de aluno que sua empresa busca — refina o Portal de Talentos.</Text>

        <Estado
          carregando={q.isLoading}
          erro={q.isError ? 'Não foi possível carregar seus interesses.' : null}
          onRetry={q.refetch}
        />

        {q.data && (
          <View style={styles.card}>
            {editando ? (
              <>
                <Text style={styles.label}>Área de foco</Text>
                <SelectPill
                  label="Qualquer área"
                  value={areaId != null ? String(areaId) : null}
                  options={[
                    { label: 'Qualquer área', value: null },
                    ...(areas.data ?? []).map((a) => ({ label: a.nome, value: String(a.id) })),
                  ]}
                  onChange={(v) => setAreaId(v ? Number(v) : null)}
                />
                <Text style={styles.label}>Tipo de vaga</Text>
                <SelectPill
                  label="Qualquer tipo"
                  value={tipoId != null ? String(tipoId) : null}
                  options={[
                    { label: 'Qualquer tipo', value: null },
                    ...(tipos.data ?? []).map((t) => ({ label: t.nome, value: String(t.id) })),
                  ]}
                  onChange={(v) => setTipoId(v ? Number(v) : null)}
                />
                <Campo label="Curso preferido" value={curso} onChange={setCurso} />
                <Campo label="Semestre mínimo" value={semestre} onChange={setSemestre} keyboard="number-pad" />

                <Text style={styles.label}>Perfis comportamentais procurados (até 2)</Text>
                <View style={styles.chips}>
                  {PERFIS_COMPORTAMENTAIS.map((p) => {
                    const on = perfis.includes(p);
                    return (
                      <Pressable
                        key={p}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => togglePerfil(p)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${ROTULO_PERFIL[p]}${on ? ', selecionado' : ''}`}
                      >
                        <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{ROTULO_PERFIL[p]}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={[styles.salvar, m.isPending && { opacity: 0.6 }]}
                  disabled={m.isPending}
                  onPress={() => m.mutate()}
                  accessibilityRole="button"
                  accessibilityLabel="Salvar interesses"
                >
                  {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <Linha icon="layers" label="Área de foco" valor={areaNome || 'Qualquer área'} />
                <Linha icon="briefcase" label="Tipo de vaga" valor={tipoNome || 'Qualquer tipo'} />
                <Linha icon="school" label="Curso preferido" valor={q.data.curso_preferido || 'Todos'} />
                <Linha
                  icon="time"
                  label="Semestre mínimo"
                  valor={q.data.semestre_minimo ? `${q.data.semestre_minimo}º ou mais` : '1º ou mais'}
                />
                <Linha
                  icon="people"
                  label="Perfis procurados"
                  valor={
                    q.data.perfis_procurados.length
                      ? q.data.perfis_procurados.map((p) => ROTULO_PERFIL[p] ?? p).join(' · ')
                      : 'Nenhum'
                  }
                />
              </>
            )}
          </View>
        )}

        {/* ── Análise de Recrutamento ── */}
        <Text style={[styles.cardTit, { marginTop: spacing.lg }]}>Análise de Recrutamento</Text>
        <Text style={styles.hint}>Funil dos candidatos que você favoritou.</Text>
        <Funil favoritos={favs.data ?? []} carregando={favs.isLoading} />

        <Pressable style={styles.linkRow} onPress={() => nav.navigate('Termos', { origem: 'app' })}>
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
          <Text style={styles.linkTxt}>Termos e privacidade</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => void sair()}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.linkTxt, { color: colors.danger }]}>Sair</Text>
        </Pressable>
      </ScrollBody>
    </View>
  );
}

function Funil({
  favoritos,
  carregando,
}: {
  favoritos: { status: string }[];
  carregando: boolean;
}) {
  if (carregando) return <Estado carregando />;
  const total = favoritos.length;
  if (!total) {
    return (
      <View style={styles.card}>
        <Text style={styles.funilVazio}>Favorite candidatos pra ver a análise aqui.</Text>
      </View>
    );
  }
  const cont: Record<string, number> = {};
  for (const s of STATUS_FAVORITO) cont[s] = 0;
  for (const f of favoritos) cont[f.status] = (cont[f.status] ?? 0) + 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.funilTopo}>
        <Text style={styles.funilNum}>{total}</Text>
        <Text style={styles.funilLbl}>
          candidato{total !== 1 ? 's' : ''} favoritado{total !== 1 ? 's' : ''}
        </Text>
      </View>
      {FUNIL.map(({ chave, rotulo, cor }) => (
        <View key={chave} style={styles.barraWrap}>
          <View style={styles.barraTopo}>
            <Text style={styles.barraRot}>{rotulo}</Text>
            <Text style={styles.barraVal}>
              {cont[chave] ?? 0} ({pct(cont[chave] ?? 0)}%)
            </Text>
          </View>
          <View style={styles.trilho}>
            <View style={[styles.preenchido, { width: `${pct(cont[chave] ?? 0)}%`, backgroundColor: cor }]} />
          </View>
        </View>
      ))}
      <Text style={styles.conversao}>
        {cont.contratado ?? 0} de {total} favoritos viraram contratação
        {total ? ` (${pct(cont.contratado ?? 0)}%).` : '.'}
      </Text>
    </View>
  );
}

function ScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
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
}: { icon: keyof typeof Ionicons.glyphMap; label: string; valor: string }) {
  return (
    <View style={styles.dl}>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ width: 22 }} />
      <Text style={styles.dt}>{label}</Text>
      <Text style={styles.dd} numberOfLines={2}>{valor}</Text>
    </View>
  );
}

function Campo({
  label, value, onChange, keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'default' | 'number-pad';
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? 'default'}
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  header: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center',
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarTxt: { color: '#fff', fontSize: 24, fontWeight: '800' },
  nomeHead: { ...typography.h2, color: '#fff', textAlign: 'center' },
  demo: { ...typography.tiny, color: colors.accent, fontWeight: '700', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
  mini: { alignItems: 'center' },
  miniVal: { ...typography.h3, color: '#fff' },
  miniLbl: { ...typography.tiny, color: 'rgba(255,255,255,0.7)' },
  body: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  cardTit: { ...typography.h3, color: colors.text },
  hint: { ...typography.tiny, color: colors.textMuted, marginBottom: spacing.xs },
  editar: { ...typography.small, color: colors.accent, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  dl: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, gap: spacing.sm },
  dt: { ...typography.small, color: colors.textMuted, width: 118 },
  dd: { ...typography.body, color: colors.text, flex: 1, textAlign: 'right' },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: spacing.md, backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { ...typography.small, color: colors.text },
  chipTxtOn: { color: '#fff', fontWeight: '700' },
  salvar: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  salvarTxt: { ...typography.h3, color: '#fff' },
  funilVazio: { ...typography.small, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  funilTopo: { alignItems: 'center', marginBottom: spacing.md },
  funilNum: { ...typography.h1, color: colors.primary },
  funilLbl: { ...typography.tiny, color: colors.textMuted },
  barraWrap: { marginBottom: spacing.sm },
  barraTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barraRot: { ...typography.small, color: colors.text, fontWeight: '600' },
  barraVal: { ...typography.tiny, color: colors.textMuted },
  trilho: { height: 8, borderRadius: 4, backgroundColor: colors.bgMuted, overflow: 'hidden' },
  preenchido: { height: 8, borderRadius: 4 },
  conversao: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  linkTxt: { ...typography.body, color: colors.textMuted },
});
