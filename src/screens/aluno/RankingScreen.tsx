import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getRanking, getFiltros } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { FiltroBar, SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const MEDALHA = ['🥇', '🥈', '🥉'];

export function RankingScreen() {
  const { sessao } = useSession();
  const meuId = sessao?.id ?? 0;

  const [curso, setCurso] = useState<string | null>(null);
  const [semestre, setSemestre] = useState<string | null>(null);
  const [disc, setDisc] = useState<string | null>(null);

  const filtros = useQuery({ queryKey: ['filtros'], queryFn: getFiltros });
  const q = useQuery({
    queryKey: ['ranking', curso, semestre, disc],
    queryFn: () => getRanking({ curso, semestre, disciplinaId: disc }),
  });

  const temFiltro = !!(curso || semestre || disc);

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Ranking</Titulo>

      <FiltroBar>
        <SelectPill
          label="Curso"
          value={curso}
          onChange={setCurso}
          options={[
            { label: 'Todos os cursos', value: null },
            ...(filtros.data?.cursos ?? []).map((c) => ({ label: c, value: c })),
          ]}
        />
        <SelectPill
          label="Semestre"
          value={semestre}
          onChange={setSemestre}
          options={[
            { label: 'Todos', value: null },
            ...(filtros.data?.semestres ?? []).map((s) => ({ label: `${s}º sem.`, value: String(s) })),
          ]}
        />
        <SelectPill
          label="Disciplina"
          value={disc}
          onChange={setDisc}
          options={[
            { label: 'Todas', value: null },
            ...(filtros.data?.disciplinas ?? []).map((d) => ({ label: d.nome_materia, value: String(d.id) })),
          ]}
        />
        {temFiltro && (
          <Pressable
            style={styles.limpar}
            onPress={() => {
              setCurso(null);
              setSemestre(null);
              setDisc(null);
            }}
          >
            <Text style={styles.limparTxt}>Limpar</Text>
          </Pressable>
        )}
      </FiltroBar>

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar o ranking.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Ninguém com esse filtro."
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
                  {[a.curso, a.semestre_atual ? `${a.semestre_atual}º sem.` : null].filter(Boolean).join(' · ')}
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
  limpar: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  limparTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
});
