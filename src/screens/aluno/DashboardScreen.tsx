import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getDashboard, getDesempenho } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado, StatTile } from '@/components/ui';
import { LinhaChart } from '@/components/chart';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function DashboardScreen() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['dashboard', id], queryFn: () => getDashboard(id) });
  const desemp = useQuery({ queryKey: ['desempenho', id], queryFn: () => getDesempenho(id) });
  const m = q.data;

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.top}>
        <View>
          <Text style={styles.ola}>Olá,</Text>
          <Text style={styles.nome}>{sessao?.nome}</Text>
          {sessao?.demo && <Text style={styles.demo}>modo demonstração</Text>}
        </View>
        <Pressable onPress={() => void sair()} style={styles.sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </Pressable>
      </View>

      <Titulo>Meu desempenho</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar suas métricas.' : null}
        onRetry={q.refetch}
      />

      {m && (
        <>
          <View style={styles.grid}>
            <StatTile valor={m.media_geral ?? '—'} rotulo="CRA Geral" />
            <StatTile
              valor={`${m.frequencia}%`}
              rotulo="Frequência"
              cor={m.frequencia >= 75 ? colors.success : colors.danger}
            />
            <StatTile
              valor={m.posicao_ranking ? `#${m.posicao_ranking}` : '—'}
              rotulo="Ranking"
              cor={colors.accent}
            />
          </View>
          <View style={styles.grid}>
            <StatTile valor={m.total_disciplinas} rotulo="Disciplinas" />
            <StatTile valor={m.total_atividades} rotulo="Atividades" />
            <StatTile
              valor={m.total_faltas}
              rotulo="Faltas"
              cor={m.total_faltas > 5 ? colors.danger : colors.text}
            />
          </View>

          {desemp.data && desemp.data.values.length > 1 && (
            <Card>
              <LinhaChart
                titulo="Evolução das notas (por semestre)"
                labels={desemp.data.labels}
                values={desemp.data.values}
              />
            </Card>
          )}

          <Pressable style={styles.link} onPress={() => nav.navigate('AlunoBoletim')}>
            <Text style={styles.linkTxt}>Ver boletim completo →</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={() => nav.navigate('AlunoRanking')}>
            <Text style={styles.linkTxt}>Ver ranking →</Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.termos} onPress={() => nav.navigate('Termos', { origem: 'app' })}>
        <Text style={styles.termosTxt}>Termos e privacidade</Text>
      </Pressable>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ola: { ...typography.body, color: colors.textMuted },
  nome: { ...typography.h1, color: colors.text },
  demo: { ...typography.tiny, color: colors.accent, fontWeight: '700' },
  sair: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  sairTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: spacing.md },
  link: { paddingVertical: spacing.md },
  linkTxt: { ...typography.body, color: colors.primary, fontWeight: '600' },
  termos: { paddingVertical: spacing.lg, alignItems: 'center' },
  termosTxt: { ...typography.small, color: colors.textMuted },
});
