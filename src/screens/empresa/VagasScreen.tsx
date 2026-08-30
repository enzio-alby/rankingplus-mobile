import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getVagasEmpresa } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function EmpVagasScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['vagas-emp', id], queryFn: () => getVagasEmpresa(id) });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Minhas Vagas</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar vagas.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma vaga publicada. (Publicação de vaga: próxima etapa.)"
        onRetry={q.refetch}
      />
      {q.data?.map((v) => (
        <Card key={v.id}>
          <View style={styles.top}>
            <Text style={styles.titulo}>{v.titulo}</Text>
            <View style={[styles.pill, v.status === 'aberta' ? styles.aberta : styles.fechada]}>
              <Text style={[styles.pillTxt, v.status === 'aberta' ? styles.abertaTxt : styles.fechadaTxt]}>
                {v.status === 'aberta' ? 'Aberta' : 'Fechada'}
              </Text>
            </View>
          </View>
          {(v.area_foco_nome || v.tipo_vaga_nome) && (
            <Text style={styles.meta}>{[v.area_foco_nome, v.tipo_vaga_nome].filter(Boolean).join(' · ')}</Text>
          )}
          {v.curso_preferido && (
            <Text style={styles.meta}>
              {v.curso_preferido}
              {v.semestre_minimo ? ` · ${v.semestre_minimo}º sem.+` : ''}
            </Text>
          )}
          {v.descricao ? <Text style={styles.desc}>{v.descricao}</Text> : null}
          <Text style={styles.interessados}>
            {v.interessados} {v.interessados === 1 ? 'aluno interessado' : 'alunos interessados'}
          </Text>
        </Card>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titulo: { ...typography.h3, color: colors.text, flex: 1 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  aberta: { backgroundColor: colors.success + '22' },
  fechada: { backgroundColor: colors.textMuted + '22' },
  pillTxt: { ...typography.tiny, fontWeight: '700' },
  abertaTxt: { color: colors.success },
  fechadaTxt: { color: colors.textMuted },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  desc: { ...typography.small, color: colors.text, marginTop: spacing.sm },
  interessados: { ...typography.small, color: colors.accent, fontWeight: '700', marginTop: spacing.sm },
});
