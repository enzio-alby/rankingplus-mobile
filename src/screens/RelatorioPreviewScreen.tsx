import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/auth/session';
import { getDadosRelatorio, exportarRelatorioPdf } from '@/lib/relatorio';
import { ScreenScroll, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'RelatorioPreview'>;

export function RelatorioPreviewScreen({ route }: Props) {
  const { alunoId } = route.params;
  const { sessao } = useSession();
  const ehDemo = !!sessao?.demo;

  // LGPD: bloqueia print/gravação de tela enquanto esta tela está visível
  // (efetivo no Android via FLAG_SECURE; iOS não deixa bloquear, só detectar).
  usePreventScreenCapture('relatorio-preview');

  const q = useQuery({
    queryKey: ['relatorio', alunoId],
    queryFn: () => getDadosRelatorio(alunoId),
  });
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    if (ehDemo) {
      Alert.alert(
        'Somente com conta real',
        'A exportação do PDF fica disponível quando você entra com sua conta. No modo demonstração dá só pra visualizar aqui dentro.',
      );
      return;
    }
    if (!q.data) return;
    try {
      setExportando(true);
      await exportarRelatorioPdf(q.data);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setExportando(false);
    }
  }

  const d = q.data;
  const m = d?.metricas;

  return (
    <View style={styles.fill}>
      <View style={styles.avisoLgpd}>
        <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
        <Text style={styles.avisoTxt}>
          Prévia protegida — captura de tela bloqueada (dados pessoais, LGPD).
        </Text>
      </View>

      <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
        <Estado
          carregando={q.isLoading}
          erro={q.isError ? 'Não foi possível montar o relatório.' : null}
          onRetry={q.refetch}
        />

        {d && m && (
          <>
            <View style={styles.folha}>
              <Text style={styles.nome}>{d.nome || 'Aluno'}</Text>
              <Text style={styles.sub}>
                {d.curso || '—'}
                {d.semestre ? ` · ${d.semestre}º semestre` : ''}
              </Text>

              <Secao titulo="Desempenho acadêmico" />
              <Linha k="CRA geral" v={m.media_geral != null ? String(m.media_geral) : '—'} />
              <Linha k="Frequência" v={`${Math.round(m.frequencia)}%`} />
              <Linha k="Posição no ranking" v={m.posicao_ranking != null ? `#${m.posicao_ranking}` : '—'} />
              <Linha k="Disciplinas cursadas" v={String(m.total_disciplinas)} />
              <Linha k="Atividades entregues" v={String(m.total_atividades)} />
              <Linha k="Faltas registradas" v={String(m.total_faltas)} />

              {d.evolucao.labels.length > 0 && (
                <>
                  <Secao titulo="Evolução do CRA" />
                  <Text style={styles.texto}>
                    {d.evolucao.labels
                      .map((l, i) => `${l}: ${d.evolucao.values[i] ?? '—'}`)
                      .join('   •   ')}
                  </Text>
                </>
              )}

              {d.destaque.length > 0 && (
                <>
                  <Secao titulo="Disciplinas de destaque (SS/MS)" />
                  {d.destaque.map((x, i) => (
                    <Text key={i} style={styles.li}>
                      • {x.nome_materia} — {x.mencao ?? ''}
                    </Text>
                  ))}
                </>
              )}

              <Secao titulo="Contato" />
              <Linha k="GitHub" v={d.github || 'não informado'} />
              <Linha k="LinkedIn" v={d.linkedin || 'não informado'} />
            </View>

            <View style={styles.folha}>
              <Text style={styles.nome}>Currículo</Text>
              <Text style={styles.sub}>
                {d.nome || 'Aluno'} · {d.curso || '—'}
              </Text>

              {!!d.ats.resumo && (
                <>
                  <Secao titulo="Resumo profissional" />
                  <Text style={styles.texto}>{d.ats.resumo}</Text>
                </>
              )}

              {d.ats.experiencias.length > 0 && (
                <>
                  <Secao titulo="Experiência profissional" />
                  {d.ats.experiencias.map((e, i) => (
                    <View key={i} style={styles.item}>
                      <Text style={styles.itemTit}>
                        {[e.cargo, e.empresa].filter(Boolean).join(' — ')}
                      </Text>
                      {(e.periodo_inicio || e.periodo_fim) && (
                        <Text style={styles.small}>
                          {[e.periodo_inicio, e.periodo_fim].filter(Boolean).join(' a ')}
                        </Text>
                      )}
                      {!!e.descricao && <Text style={styles.texto}>{e.descricao}</Text>}
                    </View>
                  ))}
                </>
              )}

              {d.ats.formacoes.length > 0 && (
                <>
                  <Secao titulo="Formação complementar" />
                  {d.ats.formacoes.map((f, i) => (
                    <View key={i} style={styles.item}>
                      <Text style={styles.itemTit}>
                        {[f.curso, f.instituicao].filter(Boolean).join(' — ')}
                      </Text>
                      {!!f.periodo_fim && <Text style={styles.small}>{f.periodo_fim}</Text>}
                    </View>
                  ))}
                </>
              )}

              {d.ats.idiomas.length > 0 && (
                <>
                  <Secao titulo="Idiomas" />
                  {d.ats.idiomas.map((it, i) => (
                    <Text key={i} style={styles.li}>
                      • {it.idioma}: {it.nivel}
                    </Text>
                  ))}
                </>
              )}

              {d.ats.habilidades.length > 0 && (
                <>
                  <Secao titulo="Habilidades" />
                  <Text style={styles.texto}>{d.ats.habilidades.join(' · ')}</Text>
                </>
              )}

              {d.ats.certificacoes.length > 0 && (
                <>
                  <Secao titulo="Certificações e cursos" />
                  {d.ats.certificacoes.map((c, i) => (
                    <Text key={i} style={styles.li}>
                      • {[c.nome, c.instituicao].filter(Boolean).join(' — ')}
                      {c.data_emissao ? ` (${c.data_emissao})` : ''}
                    </Text>
                  ))}
                </>
              )}
            </View>

            <Text style={styles.rodape}>
              Gerado pelo app em {d.geradoEm} · documento sem links (LGPD)
            </Text>
          </>
        )}
      </ScreenScroll>

      <View style={styles.barra}>
        <Pressable
          style={[styles.btn, (exportando || !d) && { opacity: 0.5 }]}
          disabled={exportando || !d}
          onPress={exportar}
          accessibilityRole="button"
          accessibilityLabel={ehDemo ? 'Exportar PDF (indisponível na demonstração)' : 'Exportar PDF'}
        >
          {exportando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.btnTxt}>Exportar PDF</Text>
            </>
          )}
        </Pressable>
        {ehDemo && <Text style={styles.demoHint}>Exportação só com conta real</Text>}
      </View>
    </View>
  );
}

function Secao({ titulo }: { titulo: string }) {
  return <Text style={styles.secao}>{titulo.toUpperCase()}</Text>;
}
function Linha({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={styles.rowV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  avisoLgpd: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avisoTxt: { ...typography.tiny, color: colors.textMuted, flex: 1 },
  folha: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  nome: { ...typography.h2, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  secao: {
    ...typography.tiny, color: colors.text, fontWeight: '800', letterSpacing: 0.6,
    marginTop: spacing.md, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingBottom: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rowK: { ...typography.small, color: colors.textMuted },
  rowV: { ...typography.small, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  texto: { ...typography.small, color: colors.text, marginTop: 2 },
  li: { ...typography.small, color: colors.text, marginTop: 2 },
  item: { marginTop: spacing.xs },
  itemTit: { ...typography.small, color: colors.text, fontWeight: '700' },
  small: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
  rodape: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  barra: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg, flex: 1,
  },
  btnTxt: { ...typography.body, color: '#fff', fontWeight: '700' },
  demoHint: { ...typography.tiny, color: colors.textMuted, flexShrink: 1 },
});
