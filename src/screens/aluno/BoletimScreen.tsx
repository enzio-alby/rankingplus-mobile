import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getBoletim } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const COR_MENCAO: Record<string, string> = {
  SS: colors.success, MS: '#65A30D', MM: colors.warning, MI: '#EA580C', II: colors.danger, SR: colors.textMuted,
};

export function BoletimScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['boletim', id], queryFn: () => getBoletim(id) });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Boletim</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar o boletim.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma disciplina no boletim."
        onRetry={q.refetch}
      />
      {q.data?.map((d, i) => (
        <Card key={i}>
          <View style={styles.linha1}>
            <Text style={styles.materia}>{d.nome_materia}</Text>
            {d.mencao && (
              <View style={[styles.badge, { backgroundColor: (COR_MENCAO[d.mencao] ?? colors.textMuted) + '22' }]}>
                <Text style={[styles.badgeTxt, { color: COR_MENCAO[d.mencao] ?? colors.textMuted }]}>
                  {d.mencao}
                </Text>
              </View>
            )}
          </View>
          {d.nome_professor ? <Text style={styles.sub}>Prof. {d.nome_professor}</Text> : null}
          {(d.sala || d.horario || d.dia_semana) && (
            <Text style={styles.sub}>
              {[d.dia_semana, d.horario, d.sala].filter(Boolean).join(' · ')}
            </Text>
          )}
          <View style={styles.metrics}>
            <Metric label="Nota" valor={d.nota_avaliacao != null ? Number(d.nota_avaliacao).toFixed(1) : '—'} />
            <Metric label="Faltas" valor={d.faltas ?? 0} alerta={(d.faltas ?? 0) > 5} />
            <Metric label="Atividades" valor={d.atividades_entregues ?? 0} />
          </View>
        </Card>
      ))}
    </ScreenScroll>
  );
}

function Metric({ label, valor, alerta }: { label: string; valor: string | number; alerta?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricVal, alerta && { color: colors.danger }]}>{valor}</Text>
      <Text style={styles.metricLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  materia: { ...typography.h3, color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  badgeTxt: { ...typography.small, fontWeight: '800' },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  metrics: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  metric: { flex: 1, alignItems: 'center' },
  metricVal: { ...typography.h3, color: colors.primary },
  metricLbl: { ...typography.tiny, color: colors.textMuted },
});
