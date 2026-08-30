import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getStatsProfessor, getDisciplinasProfessor } from '@/api/professor';
import { ScreenScroll, Titulo, Card, Estado, StatTile } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function ProfDashboardScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const id = sessao?.id ?? 0;
  const stats = useQuery({ queryKey: ['prof-stats', id], queryFn: () => getStatsProfessor(id) });
  const discs = useQuery({ queryKey: ['prof-discs', id], queryFn: () => getDisciplinasProfessor(id) });
  const s = stats.data;

  return (
    <ScreenScroll
      onRefresh={() => {
        stats.refetch();
        discs.refetch();
      }}
      refreshing={stats.isRefetching || discs.isRefetching}
    >
      <View style={styles.top}>
        <View>
          <Text style={styles.ola}>Prof.</Text>
          <Text style={styles.nome}>{sessao?.nome}</Text>
          {sessao?.demo && <Text style={styles.demo}>modo demonstração</Text>}
        </View>
        <Pressable onPress={() => void sair()} style={styles.sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </Pressable>
      </View>

      <Titulo>Visão geral</Titulo>
      <Estado carregando={stats.isLoading} erro={stats.isError ? 'Erro ao carregar.' : null} onRetry={stats.refetch} />
      {s && (
        <>
          <View style={styles.grid}>
            <StatTile valor={s.turmas} rotulo="Turmas" />
            <StatTile valor={s.alunos} rotulo="Alunos" />
          </View>
          <View style={styles.grid}>
            <StatTile valor={s.media_geral ?? '—'} rotulo="Média geral" />
            <StatTile
              valor={s.presenca_media != null ? `${s.presenca_media}%` : '—'}
              rotulo="Presença média"
              cor={Number(s.presenca_media) >= 75 ? colors.success : colors.danger}
            />
          </View>
        </>
      )}

      <Titulo>Minhas turmas</Titulo>
      <Estado
        carregando={discs.isLoading}
        erro={discs.isError ? 'Erro ao carregar turmas.' : null}
        vazio={discs.data?.length === 0}
        onRetry={discs.refetch}
      />
      {discs.data?.map((d) => (
        <Pressable key={d.id} onPress={() => nav.navigate('ProfTurmas', { discId: d.id, nome: d.nome_materia })}>
          <Card>
            <View style={styles.linha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.materia}>{d.nome_materia}</Text>
                <Text style={styles.sub}>
                  {[d.dia_semana, d.horario, d.sala].filter(Boolean).join(' · ') || 'sem horário'}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>{d.total_alunos} alunos</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ola: { ...typography.body, color: colors.textMuted },
  nome: { ...typography.h1, color: colors.text },
  demo: { ...typography.tiny, color: colors.accent, fontWeight: '700' },
  sair: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sairTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: spacing.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  materia: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  pill: { backgroundColor: colors.bgMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  pillTxt: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
});
