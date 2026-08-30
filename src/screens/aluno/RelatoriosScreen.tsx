import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getDesempenho, getFrequenciaDisciplinas, getBoletim } from '@/api/aluno';
import { ScreenScroll, Card, Estado } from '@/components/ui';
import { LinhaChart, BarrasChart } from '@/components/chart';
import { colors, spacing, typography } from '@/theme/tokens';

const CORES_MENCAO = [colors.success, '#65A30D', colors.warning, '#EA580C', colors.danger];

export function RelatoriosScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;

  const desemp = useQuery({ queryKey: ['desempenho', id], queryFn: () => getDesempenho(id) });
  const freq = useQuery({ queryKey: ['freq-disc', id], queryFn: () => getFrequenciaDisciplinas(id) });
  const boletim = useQuery({ queryKey: ['boletim', id], queryFn: () => getBoletim(id) });

  const menc = (boletim.data ?? []).reduce(
    (a, d) => {
      const i = ['SS', 'MS', 'MM', 'MI', 'II'].indexOf(d.mencao ?? '');
      if (i >= 0) a[i] += 1;
      return a;
    },
    [0, 0, 0, 0, 0],
  );

  const carregando = desemp.isLoading || freq.isLoading || boletim.isLoading;

  return (
    <ScreenScroll
      onRefresh={() => {
        desemp.refetch();
        freq.refetch();
        boletim.refetch();
      }}
      refreshing={desemp.isRefetching || freq.isRefetching}
    >
      <Text style={styles.intro}>Seus indicadores acadêmicos consolidados.</Text>
      <Estado carregando={carregando} />

      {desemp.data && desemp.data.values.length > 1 && (
        <Card>
          <LinhaChart
            titulo="Evolução das notas (por semestre)"
            labels={desemp.data.labels}
            values={desemp.data.values}
          />
        </Card>
      )}

      {freq.data && freq.data.length > 0 && (
        <Card>
          <BarrasChart
            titulo="Frequência por disciplina (%)"
            labels={freq.data.map((f) => f.disciplina.split(' ')[0])}
            values={freq.data.map((f) => f.frequencia)}
            cores={freq.data.map((f) => (f.frequencia >= 75 ? colors.success : colors.danger))}
          />
        </Card>
      )}

      {menc.some((n) => n > 0) && (
        <Card>
          <BarrasChart
            titulo="Distribuição das minhas menções"
            labels={['SS', 'MS', 'MM', 'MI', 'II']}
            values={menc}
            cores={CORES_MENCAO}
          />
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
});
