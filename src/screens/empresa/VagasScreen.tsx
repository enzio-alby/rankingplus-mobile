import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getVagasEmpresa } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export function EmpVagasScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['vagas-emp', id], queryFn: () => getVagasEmpresa(id) });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.top}>
        <Titulo>Minhas Vagas</Titulo>
        <Pressable
          style={styles.nova}
          onPress={() => nav.navigate('VagaForm')}
          accessibilityRole="button"
          accessibilityLabel="Publicar nova vaga"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.novaTxt}>Nova vaga</Text>
        </Pressable>
      </View>

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar vagas.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma vaga publicada. Toque em “Nova vaga”."
        onRetry={q.refetch}
      />

      {q.data?.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => nav.navigate('VagaForm', { vaga: v })}
          accessibilityRole="button"
          accessibilityLabel={`Editar vaga ${v.titulo}`}
        >
          <Card>
            <View style={styles.cardTop}>
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
            {v.descricao ? (
              <Text style={styles.desc} numberOfLines={3}>
                {v.descricao}
              </Text>
            ) : null}
            <View style={styles.rodape}>
              <Text style={styles.interessados}>
                {v.interessados} {v.interessados === 1 ? 'aluno interessado' : 'alunos interessados'}
              </Text>
              <Text style={styles.editar}>Editar ›</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nova: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  novaTxt: { ...typography.small, color: '#fff', fontWeight: '700' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titulo: { ...typography.h3, color: colors.text, flex: 1 },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  aberta: { backgroundColor: colors.success + '22' },
  fechada: { backgroundColor: colors.textMuted + '22' },
  pillTxt: { ...typography.tiny, fontWeight: '700' },
  abertaTxt: { color: colors.success },
  fechadaTxt: { color: colors.textMuted },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  desc: { ...typography.small, color: colors.text, marginTop: spacing.sm },
  rodape: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm,
  },
  interessados: { ...typography.small, color: colors.accent, fontWeight: '700' },
  editar: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
});
