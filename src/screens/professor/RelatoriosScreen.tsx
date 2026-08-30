import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import {
  getDisciplinasProfessor,
  getStatsDisciplinas,
  getAlunosDaDisciplina,
} from '@/api/professor';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { BarrasChart } from '@/components/chart';
import { FiltroBar, SelectPill } from '@/components/filtro';
import { RelatorioAcoes } from '@/components/RelatorioAcoes';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const CORES_MENCAO = [colors.success, '#65A30D', colors.warning, '#EA580C', colors.danger];
const ORDEM_DIA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function ProfRelatoriosScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const [turmaSel, setTurmaSel] = useState<string | null>(null);

  const discs = useQuery({ queryKey: ['prof-discs', id], queryFn: () => getDisciplinasProfessor(id) });
  const dstats = useQuery({ queryKey: ['prof-dstats', id], queryFn: () => getStatsDisciplinas(id) });
  const alunosTurma = useQuery({
    queryKey: ['turma-alunos', id, Number(turmaSel)],
    queryFn: () => getAlunosDaDisciplina(id, Number(turmaSel)),
    enabled: !!turmaSel,
  });

  const porDia = new Map<string, typeof discs.data>();
  for (const d of discs.data ?? []) {
    const dia = d.dia_semana || 'Sem dia definido';
    if (!porDia.has(dia)) porDia.set(dia, []);
    (porDia.get(dia) as NonNullable<typeof discs.data>).push(d);
  }
  const diasOrdenados = [...porDia.keys()].sort((a, b) => {
    const ia = ORDEM_DIA.indexOf(a);
    const ib = ORDEM_DIA.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const mencTotais = (dstats.data ?? []).reduce(
    (acc, d) => [
      acc[0] + Number(d.cnt_ss || 0), acc[1] + Number(d.cnt_ms || 0), acc[2] + Number(d.cnt_mm || 0),
      acc[3] + Number(d.cnt_mi || 0), acc[4] + Number(d.cnt_ii || 0),
    ],
    [0, 0, 0, 0, 0],
  );

  return (
    <ScreenScroll
      onRefresh={() => {
        discs.refetch();
        dstats.refetch();
      }}
      refreshing={discs.isRefetching || dstats.isRefetching}
    >
      <Titulo>Relatórios</Titulo>
      <Estado
        carregando={discs.isLoading || dstats.isLoading}
        erro={discs.isError ? 'Erro ao carregar.' : null}
        onRetry={discs.refetch}
      />

      {/* ── Grade horária ── */}
      <Text style={styles.secao}>Aulas e horários</Text>
      {(discs.data?.length ?? 0) === 0 && !discs.isLoading && (
        <Card><Text style={styles.vazio}>Nenhuma turma cadastrada.</Text></Card>
      )}
      {diasOrdenados.map((dia) => (
        <Card key={dia}>
          <Text style={styles.dia}>{dia}</Text>
          {(porDia.get(dia) ?? [])
            .slice()
            .sort((a, b) => (a.horario ?? '').localeCompare(b.horario ?? ''))
            .map((d) => (
              <View key={d.id} style={styles.aula}>
                <Text style={styles.hora}>{d.horario ?? '—'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materia}>{d.nome_materia}</Text>
                  <Text style={styles.aulaSub}>
                    {[d.sala, `${d.total_alunos} alunos`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            ))}
        </Card>
      ))}

      {/* ── Desempenho por turma ── */}
      {dstats.data && dstats.data.length > 0 && (
        <>
          <Text style={styles.secao}>Desempenho por turma</Text>
          <Card>
            <View style={[styles.linha, styles.linhaHead]}>
              <Text style={[styles.cel, styles.celNome, styles.celHead]}>Turma</Text>
              <Text style={[styles.cel, styles.celHead]}>Média</Text>
              <Text style={[styles.cel, styles.celHead]}>Freq.</Text>
              <Text style={[styles.cel, styles.celHead]}>Alunos</Text>
            </View>
            {dstats.data.map((d) => (
              <View key={d.id} style={styles.linha}>
                <Text style={[styles.cel, styles.celNome]} numberOfLines={1}>{d.nome_materia}</Text>
                <Text style={styles.cel}>{d.media ?? '—'}</Text>
                <Text
                  style={[
                    styles.cel,
                    { color: Number(d.frequencia) >= 75 ? colors.success : colors.danger },
                  ]}
                >
                  {d.frequencia != null ? `${d.frequencia}%` : '—'}
                </Text>
                <Text style={styles.cel}>{d.total_alunos}</Text>
              </View>
            ))}
          </Card>

          <Card>
            <BarrasChart
              titulo="Média por disciplina"
              labels={dstats.data.map((d) => d.nome_materia.split(' ')[0])}
              values={dstats.data.map((d) => Number(d.media ?? 0))}
            />
          </Card>

          {mencTotais.some((n) => n > 0) && (
            <Card>
              <BarrasChart
                titulo="Distribuição de menções (todas as turmas)"
                labels={['SS', 'MS', 'MM', 'MI', 'II']}
                values={mencTotais}
                cores={CORES_MENCAO}
              />
            </Card>
          )}
        </>
      )}

      {/* ── Relatório + currículo de um aluno ── */}
      <Text style={styles.secao}>Relatório do aluno (PDF + currículo)</Text>
      <Card>
        <Text style={styles.hint}>
          Escolha a turma e o aluno para visualizar ou exportar o mesmo relatório que a empresa
          vê no Portal de Talentos (desempenho + currículo ATS).
        </Text>
        <FiltroBar>
          <SelectPill
            label="Turma"
            value={turmaSel}
            onChange={setTurmaSel}
            options={[
              { label: 'Escolher turma', value: null },
              ...(discs.data ?? []).map((d) => ({ label: d.nome_materia, value: String(d.id) })),
            ]}
          />
        </FiltroBar>

        {turmaSel && (
          <>
            <Estado
              carregando={alunosTurma.isLoading}
              erro={alunosTurma.isError ? 'Erro ao carregar os alunos.' : null}
              vazio={alunosTurma.data?.length === 0}
              vazioTexto="Nenhum aluno nessa turma."
              onRetry={alunosTurma.refetch}
            />
            {alunosTurma.data?.map((a) => (
              <View key={a.id} style={styles.alunoRel}>
                <Text style={styles.alunoRelNome} numberOfLines={1}>{a.nome}</Text>
                <RelatorioAcoes alunoId={a.id} nome={a.nome} />
              </View>
            ))}
          </>
        )}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  secao: {
    ...typography.small, color: colors.textMuted, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: 2,
  },
  vazio: { ...typography.small, color: colors.textMuted },
  dia: { ...typography.small, color: colors.primary, fontWeight: '800', marginBottom: spacing.xs },
  aula: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: 4 },
  hora: { ...typography.small, color: colors.text, fontWeight: '700', width: 48 },
  materia: { ...typography.body, color: colors.text, fontWeight: '600' },
  aulaSub: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  linhaHead: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6 },
  cel: { ...typography.small, color: colors.text, width: 52, textAlign: 'center' },
  celNome: { flex: 1, textAlign: 'left' },
  celHead: { ...typography.tiny, color: colors.textMuted, fontWeight: '700' },
  hint: { ...typography.tiny, color: colors.textMuted, marginBottom: spacing.xs },
  alunoRel: {
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm, gap: spacing.xs,
  },
  alunoRelNome: { ...typography.body, color: colors.text, fontWeight: '600' },
});
