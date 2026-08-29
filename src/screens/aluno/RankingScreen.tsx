import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getRanking } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const MEDALHA = ['🥇', '🥈', '🥉'];

export function RankingScreen() {
  const { sessao } = useSession();
  const meuId = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['ranking'], queryFn: getRanking });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Ranking</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar o ranking.' : null}
        vazio={q.data?.length === 0}
        onRetry={q.refetch}
      />
      {q.data?.map((a, i) => {
        const eu = a.id === meuId;
        return (
          <Card key={a.id} style={eu ? styles.eu : undefined}>
            <View style={styles.linha}>
              <Text style={styles.pos}>{MEDALHA[i] ?? `${i + 1}º`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nome, eu && { color: colors.primary }]} numberOfLines={1}>
                  {a.nome}
                  {eu ? '  (você)' : ''}
                </Text>
                <Text style={styles.sub}>
                  {[a.curso, a.semestre_atual ? `${a.semestre_atual}º sem.` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <View style={styles.dir}>
                <Text style={styles.pts}>{Number(a.pontuacao).toFixed(2)}</Text>
                <Text style={styles.freq}>{a.frequencia}% freq.</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  eu: { borderWidth: 2, borderColor: colors.accent },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pos: { ...typography.h3, width: 40, textAlign: 'center', color: colors.textMuted },
  nome: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 1 },
  dir: { alignItems: 'flex-end' },
  pts: { ...typography.h3, color: colors.primary },
  freq: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
});
