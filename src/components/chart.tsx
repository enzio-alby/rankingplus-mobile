import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { colors, spacing, typography } from '@/theme/tokens';

/** Linha de evolução (ex.: notas por semestre, 0–10). */
export function LinhaChart({
  labels,
  values,
  titulo,
  maxValue = 10,
}: {
  labels: string[];
  values: number[];
  titulo?: string;
  maxValue?: number;
}) {
  if (!values.length) return null;
  const data = values.map((v, i) => ({ value: Number(v) || 0, label: labels[i] ?? '' }));
  return (
    <View style={styles.wrap}>
      {titulo && <Text style={styles.titulo}>{titulo}</Text>}
      <LineChart
        data={data}
        maxValue={maxValue}
        noOfSections={4}
        color={colors.accent}
        thickness={3}
        dataPointsColor={colors.accent}
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        rulesColor={colors.border}
        rulesType="dashed"
        initialSpacing={16}
        spacing={Math.max(40, 240 / data.length)}
        adjustToWidth
        disableScroll
        height={140}
      />
    </View>
  );
}

/** Barras (ex.: distribuição de menções, contagem de alunos). */
export function BarrasChart({
  labels,
  values,
  cores,
  titulo,
}: {
  labels: string[];
  values: number[];
  cores?: string[];
  titulo?: string;
}) {
  if (!values.length || values.every((v) => !v)) return null;
  const data = values.map((v, i) => ({
    value: Number(v) || 0,
    label: labels[i] ?? '',
    frontColor: cores?.[i] ?? colors.primary,
  }));
  return (
    <View style={styles.wrap}>
      {titulo && <Text style={styles.titulo}>{titulo}</Text>}
      <BarChart
        data={data}
        barWidth={26}
        noOfSections={3}
        yAxisTextStyle={styles.axis}
        xAxisLabelTextStyle={styles.axis}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        rulesColor={colors.border}
        initialSpacing={12}
        spacing={18}
        adjustToWidth
        disableScroll
        height={140}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  titulo: { ...typography.small, color: colors.textMuted, fontWeight: '600', marginBottom: spacing.sm },
  axis: { color: colors.textMuted, fontSize: 10 },
});
