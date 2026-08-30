import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session';
import {
  getTalentos, getPerfilCandidato, getStatusFavorito, getFavoritos,
  favoritar, desfavoritar, mudarStatusFavorito,
} from '@/api/empresa';
import { getDesempenho, getFiltros } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado, StatTile } from '@/components/ui';
import { LinhaChart } from '@/components/chart';
import { FiltroBar, SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';
import { STATUS_FAVORITO, type Compatibilidade, type StatusFavorito } from '@/api_mobile';

function corFaixa(f?: string) {
  return f === 'alta' ? colors.compatAlta : f === 'media' ? colors.compatMedia : colors.compatBaixa;
}

const ROTULO_STATUS: Record<StatusFavorito, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  entrevista_marcada: 'Entrevista',
  contratado: 'Contratado',
  descartado: 'Descartado',
};

const CRA_OPCOES = [
  { label: 'CRA mín.', value: null },
  { label: 'CRA ≥ 7', value: '7' },
  { label: 'CRA ≥ 8', value: '8' },
  { label: 'CRA ≥ 8.5', value: '8.5' },
  { label: 'CRA ≥ 9', value: '9' },
];

/** Portal de Talentos. `readonly` = visão de aluno/professor (sem favoritar). */
export function TalentosScreen({ readonly = false }: { readonly?: boolean }) {
  const { sessao } = useSession();
  const empId = sessao?.id ?? 0;
  const ehEmpresa = sessao?.tipo === 'empresa' && !readonly;

  const [curso, setCurso] = useState<string | null>(null);
  const [sem, setSem] = useState<string | null>(null);
  const [hab, setHab] = useState<string | null>(null);
  const [cra, setCra] = useState<string | null>(null);

  const filtros = useQuery({ queryKey: ['filtros'], queryFn: getFiltros });
  const q = useQuery({
    queryKey: ['talentos', empId, curso, sem, hab, cra, ehEmpresa],
    queryFn: () =>
      getTalentos(ehEmpresa ? empId : 0, { curso, semestreMin: sem, habilidade: hab, craMin: cra }),
  });
  const favs = useQuery({
    queryKey: ['favoritos', empId],
    queryFn: () => getFavoritos(empId),
    enabled: ehEmpresa,
  });
  const favMap = new Map((favs.data ?? []).map((f) => [f.id, f.status]));
  const [sel, setSel] = useState<number | null>(null);
  const temFiltro = !!(curso || sem || hab || cra);

  return (
    <>
      <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
        <Titulo>Portal de Talentos</Titulo>
        <Text style={styles.sub}>
          {ehEmpresa
            ? 'Candidatos com desempenho acadêmico verificado.'
            : 'Veja como seu perfil (e o dos colegas) aparece para as empresas.'}
        </Text>

        <FiltroBar>
          <SelectPill
            label="Curso"
            value={curso}
            onChange={setCurso}
            options={[{ label: 'Todos os cursos', value: null }, ...(filtros.data?.cursos ?? []).map((c) => ({ label: c, value: c }))]}
          />
          <SelectPill
            label="Semestre mín."
            value={sem}
            onChange={setSem}
            options={[{ label: 'Qualquer', value: null }, ...(filtros.data?.semestres ?? []).map((s) => ({ label: `${s}º+`, value: String(s) }))]}
          />
          <SelectPill
            label="Habilidade"
            value={hab}
            onChange={setHab}
            options={[{ label: 'Qualquer', value: null }, ...(filtros.data?.disciplinas ?? []).map((d) => ({ label: d.nome_materia, value: d.nome_materia }))]}
          />
          <SelectPill label="CRA mín." value={cra} onChange={setCra} options={CRA_OPCOES} />
          {temFiltro && (
            <Pressable
              style={styles.limpar}
              onPress={() => {
                setCurso(null);
                setSem(null);
                setHab(null);
                setCra(null);
              }}
            >
              <Text style={styles.limparTxt}>Limpar</Text>
            </Pressable>
          )}
        </FiltroBar>

        <Estado
          carregando={q.isLoading}
          erro={q.isError ? 'Erro ao carregar candidatos.' : null}
          vazio={q.data?.length === 0}
          onRetry={q.refetch}
        />
        {q.data?.map((t) => {
          const st = favMap.get(t.id);
          return (
          <Pressable key={t.id} onPress={() => setSel(t.id)}>
            <Card>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nomeRow}>
                    {st && <Text style={styles.star}>★</Text>}
                    <Text style={styles.nome}>{t.nome}</Text>
                  </View>
                  <Text style={styles.sub}>
                    {[t.curso, t.semestre ? `${t.semestre}º sem.` : null, st ? ROTULO_STATUS[st] : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <View style={styles.dir}>
                  <Text style={styles.cra}>CRA {t.media_geral ?? '—'}</Text>
                  {t.compatibilidade && (
                    <View style={[styles.match, { backgroundColor: corFaixa(t.compatibilidade.faixa) + '22' }]}>
                      <Text style={[styles.matchTxt, { color: corFaixa(t.compatibilidade.faixa) }]}>
                        {t.compatibilidade.score}% match
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {t.pontos_fortes.length > 0 && (
                <View style={styles.chips}>
                  {t.pontos_fortes.map((p, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipTxt}>{p.disciplina} {Number(p.media).toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </Pressable>
          );
        })}
      </ScreenScroll>

      <CandidatoModal
        alunoId={sel}
        empresaId={empId}
        ehEmpresa={ehEmpresa}
        onClose={() => setSel(null)}
      />
    </>
  );
}

function CandidatoModal({
  alunoId,
  empresaId,
  ehEmpresa,
  onClose,
}: {
  alunoId: number | null;
  empresaId: number;
  ehEmpresa: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['candidato', alunoId, empresaId, ehEmpresa],
    queryFn: () => getPerfilCandidato(alunoId as number, ehEmpresa ? empresaId : 0),
    enabled: alunoId != null,
  });
  const desemp = useQuery({
    queryKey: ['candidato-desemp', alunoId],
    queryFn: () => getDesempenho(alunoId as number),
    enabled: alunoId != null,
  });
  const favStatus = useQuery({
    queryKey: ['status-fav', empresaId, alunoId],
    queryFn: () => getStatusFavorito(empresaId, alunoId as number),
    enabled: alunoId != null && ehEmpresa,
  });
  const d = q.data;

  function invalidarFav() {
    qc.invalidateQueries({ queryKey: ['status-fav'] });
    qc.invalidateQueries({ queryKey: ['favoritos'] });
    qc.invalidateQueries({ queryKey: ['talentos'] });
  }
  const favBtn = useMutation({
    mutationFn: () =>
      favStatus.data ? desfavoritar(empresaId, alunoId as number) : favoritar(empresaId, alunoId as number),
    onSuccess: invalidarFav,
    onError: () => Alert.alert('Erro', 'Não foi possível atualizar o favorito.'),
  });
  const statusMut = useMutation({
    mutationFn: (s: StatusFavorito) => mudarStatusFavorito(empresaId, alunoId as number, s),
    onSuccess: invalidarFav,
  });

  return (
    <Modal visible={alunoId != null} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.mHead, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.mNome}>{d?.nome ?? 'Candidato'}</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.mClose}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={{ backgroundColor: colors.bgMuted }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Estado carregando={q.isLoading} erro={q.isError ? 'Erro ao carregar perfil.' : null} onRetry={q.refetch} />
        {d && (
          <>
            <Text style={styles.sub}>
              {[d.curso, d.semestre ? `${d.semestre}º sem.` : null].filter(Boolean).join(' · ')}
            </Text>

            {ehEmpresa && (
              <>
                <View style={styles.favRow}>
                  <Pressable
                    style={[styles.favBtn, favStatus.data && styles.favBtnOn]}
                    onPress={() => favBtn.mutate()}
                    disabled={favBtn.isPending}
                  >
                    <Text style={[styles.favBtnTxt, favStatus.data && styles.favBtnTxtOn]}>
                      {favStatus.data ? '★ Favoritado' : '☆ Favoritar'}
                    </Text>
                  </Pressable>
                </View>
                {favStatus.data && (
                  <View style={styles.statusRow}>
                    {STATUS_FAVORITO.filter((s) => s !== 'descartado').map((s) => (
                      <Pressable
                        key={s}
                        style={[styles.stBtn, favStatus.data === s && styles.stBtnOn]}
                        onPress={() => statusMut.mutate(s)}
                      >
                        <Text style={[styles.stTxt, favStatus.data === s && styles.stTxtOn]}>
                          {ROTULO_STATUS[s]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            {d.compatibilidade && <CompatCard c={d.compatibilidade} />}

            <View style={styles.grid}>
              <StatTile valor={d.metricas.media_geral ?? '—'} rotulo="CRA" />
              <StatTile
                valor={`${d.metricas.frequencia}%`}
                rotulo="Frequência"
                cor={d.metricas.frequencia >= 75 ? colors.success : colors.danger}
              />
              <StatTile
                valor={d.metricas.posicao_ranking ? `#${d.metricas.posicao_ranking}` : '—'}
                rotulo="Ranking"
                cor={colors.accent}
              />
            </View>

            {desemp.data && desemp.data.values.length > 1 && (
              <Card>
                <LinhaChart
                  titulo="Evolução das notas"
                  labels={desemp.data.labels}
                  values={desemp.data.values}
                />
              </Card>
            )}

            <Card>
              <Text style={styles.secTitulo}>Disciplinas de destaque</Text>
              {d.disciplinas_destaque.length === 0 ? (
                <Text style={styles.sub}>Nenhuma.</Text>
              ) : (
                d.disciplinas_destaque.map((x, i) => (
                  <View key={i} style={styles.destaque}>
                    <Text style={styles.destNome}>{x.nome_materia}</Text>
                    <Text style={styles.destNota}>{x.mencao} · {Number(x.nota).toFixed(1)}</Text>
                  </View>
                ))
              )}
            </Card>
            <Text style={styles.nota}>Conversas ficam na aba “Chat”.</Text>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}

function CompatCard({ c }: { c: Compatibilidade }) {
  const cor = corFaixa(c.faixa);
  return (
    <View style={[styles.compat, { borderLeftColor: cor }]}>
      <View style={styles.compatHead}>
        <Text style={styles.compatLbl}>COMPATIBILIDADE</Text>
        <Text style={[styles.compatScore, { color: cor }]}>{c.score}%</Text>
      </View>
      {c.componentes.map((x, i) => (
        <View key={i} style={styles.compRow}>
          <Text style={[styles.compLbl, !x.aplicavel && { color: colors.textMuted }]}>{x.rotulo}</Text>
          <Text style={styles.compVal}>{x.aplicavel ? `${x.obtido}/${x.peso}` : 'n/d'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  emp: { ...typography.h3, color: colors.text },
  demo: { ...typography.tiny, color: colors.accent, fontWeight: '700' },
  sairBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sairTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  limpar: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7, justifyContent: 'center' },
  limparTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  favRow: { flexDirection: 'row' },
  favBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  favBtnOn: { backgroundColor: colors.accent },
  favBtnTxt: { ...typography.body, color: colors.accent, fontWeight: '700' },
  favBtnTxtOn: { color: '#fff' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingVertical: 5, paddingHorizontal: spacing.md,
  },
  stBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stTxt: { ...typography.small, color: colors.text },
  stTxtOn: { color: '#fff', fontWeight: '700' },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nomeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: colors.accent, fontSize: 14 },
  nome: { ...typography.h3, color: colors.text },
  dir: { alignItems: 'flex-end', gap: 4 },
  cra: { ...typography.small, color: colors.primary, fontWeight: '700' },
  match: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  matchTxt: { ...typography.tiny, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: { backgroundColor: colors.bgMuted, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipTxt: { ...typography.tiny, color: colors.textMuted },
  mHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mNome: { ...typography.h2, color: colors.text, flex: 1 },
  mClose: { fontSize: 20, color: colors.textMuted },
  grid: { flexDirection: 'row', gap: spacing.md },
  secTitulo: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  destaque: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  destNome: { ...typography.body, color: colors.text, flex: 1 },
  destNota: { ...typography.small, color: colors.primary, fontWeight: '600' },
  compat: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderLeftWidth: 4, elevation: 1,
  },
  compatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  compatLbl: { ...typography.tiny, color: colors.textMuted, letterSpacing: 1, fontWeight: '700' },
  compatScore: { ...typography.h1 },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  compLbl: { ...typography.small, color: colors.text },
  compVal: { ...typography.small, color: colors.textMuted },
  nota: { ...typography.tiny, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
});
