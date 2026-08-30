import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getDisciplinasProfessor, getAlunosDaDisciplina } from '@/api/professor';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const COR_MENCAO: Record<string, string> = {
  SS: colors.success, MS: '#65A30D', MM: colors.warning, MI: '#EA580C', II: colors.danger,
};

export function ProfTurmasScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const discs = useQuery({ queryKey: ['prof-discs', id], queryFn: () => getDisciplinasProfessor(id) });
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <ScreenScroll onRefresh={discs.refetch} refreshing={discs.isRefetching}>
      <Titulo>Turmas</Titulo>
      <Estado
        carregando={discs.isLoading}
        erro={discs.isError ? 'Erro ao carregar turmas.' : null}
        vazio={discs.data?.length === 0}
        onRetry={discs.refetch}
      />
      {discs.data?.map((d) => (
        <Card key={d.id}>
          <Pressable
            style={styles.head}
            onPress={() => setAberta((a) => (a === d.id ? null : d.id))}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.materia}>{d.nome_materia}</Text>
              <Text style={styles.sub}>
                {[d.dia_semana, d.horario, d.sala].filter(Boolean).join(' · ') || 'sem horário'} · {d.total_alunos} alunos
              </Text>
            </View>
            <Text style={styles.chev}>{aberta === d.id ? '▲' : '▼'}</Text>
          </Pressable>
          {aberta === d.id && <ListaAlunos profId={id} discId={d.id} />}
        </Card>
      ))}
    </ScreenScroll>
  );
}

function ListaAlunos({ profId, discId }: { profId: number; discId: number }) {
  const q = useQuery({
    queryKey: ['turma-alunos', profId, discId],
    queryFn: () => getAlunosDaDisciplina(profId, discId),
  });
  return (
    <View style={styles.alunos}>
      <Estado carregando={q.isLoading} erro={q.isError ? 'Erro.' : null} vazio={q.data?.length === 0} onRetry={q.refetch} />
      {q.data?.map((a, i) => (
        <View key={`${a.id}-${i}`} style={styles.aluno}>
          <View style={{ flex: 1 }}>
            <Text style={styles.alunoNome}>{a.nome}</Text>
            <Text style={styles.alunoSub}>{a.matricula ?? '—'} · {Math.round(a.frequencia)}% freq.</Text>
          </View>
          <Text style={styles.alunoFaltas}>{a.faltas ?? 0} faltas</Text>
          {a.mencao ? (
            <View style={[styles.badge, { backgroundColor: (COR_MENCAO[a.mencao] ?? colors.textMuted) + '22' }]}>
              <Text style={[styles.badgeTxt, { color: COR_MENCAO[a.mencao] ?? colors.textMuted }]}>{a.mencao}</Text>
            </View>
          ) : (
            <Text style={styles.semNota}>—</Text>
          )}
        </View>
      ))}
      <Text style={styles.nota}>Edição de lançamento (menção/faltas/nota): próxima etapa.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  materia: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  chev: { color: colors.textMuted, fontSize: 12 },
  alunos: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm },
  aluno: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  alunoNome: { ...typography.body, color: colors.text, fontWeight: '600' },
  alunoSub: { ...typography.tiny, color: colors.textMuted },
  alunoFaltas: { ...typography.tiny, color: colors.textMuted },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeTxt: { ...typography.small, fontWeight: '800' },
  semNota: { color: colors.textMuted, width: 30, textAlign: 'center' },
  nota: { ...typography.tiny, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm },
});
