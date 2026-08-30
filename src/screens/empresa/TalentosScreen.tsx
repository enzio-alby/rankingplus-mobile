import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session';
import { getTalentos, getPerfilCandidato } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado, StatTile } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';
import type { Compatibilidade } from '@/api_mobile';

function corFaixa(f?: string) {
  return f === 'alta' ? colors.compatAlta : f === 'media' ? colors.compatMedia : colors.compatBaixa;
}

export function TalentosScreen() {
  const { sessao } = useSession();
  const empId = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['talentos', empId], queryFn: () => getTalentos(empId) });
  const [sel, setSel] = useState<number | null>(null);

  return (
    <>
      <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
        <Titulo>Portal de Talentos</Titulo>
        <Text style={styles.sub}>Candidatos com desempenho acadêmico verificado.</Text>
        <Estado
          carregando={q.isLoading}
          erro={q.isError ? 'Erro ao carregar candidatos.' : null}
          vazio={q.data?.length === 0}
          onRetry={q.refetch}
        />
        {q.data?.map((t) => (
          <Pressable key={t.id} onPress={() => setSel(t.id)}>
            <Card>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{t.nome}</Text>
                  <Text style={styles.sub}>
                    {[t.curso, t.semestre ? `${t.semestre}º sem.` : null].filter(Boolean).join(' · ')}
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
        ))}
      </ScreenScroll>

      <CandidatoModal alunoId={sel} empresaId={empId} onClose={() => setSel(null)} />
    </>
  );
}

function CandidatoModal({
  alunoId,
  empresaId,
  onClose,
}: {
  alunoId: number | null;
  empresaId: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: ['candidato', alunoId, empresaId],
    queryFn: () => getPerfilCandidato(alunoId as number, empresaId),
    enabled: alunoId != null,
  });
  const d = q.data;

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
            <Text style={styles.nota}>Favoritar / status / mensagens: próxima etapa.</Text>
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
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
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
