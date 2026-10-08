import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getVagasEmpresa, getInteressadosVaga, abrirChatInteressado } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

/** Lista de interessados de uma vaga, com botão "Conversar" por aluno. */
function Interessados({ empresaId, vagaId }: { empresaId: number; vagaId: number }) {
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const [abrindoId, setAbrindoId] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ['interessados-vaga', empresaId, vagaId],
    queryFn: () => getInteressadosVaga(empresaId, vagaId),
  });

  const conversar = useMutation({
    mutationFn: (a: { id: number; nome: string }) =>
      abrirChatInteressado(empresaId, vagaId, a.id, a.nome),
    onMutate: (a) => setAbrindoId(a.id),
    onSettled: () => setAbrindoId(null),
    onSuccess: (r, a) => {
      qc.invalidateQueries({ queryKey: ['conversas'] });
      // o servidor marca o aluno como "contatado" nos favoritos
      qc.invalidateQueries({ queryKey: ['favoritos'] });
      qc.invalidateQueries({ queryKey: ['status-fav'] });
      nav.navigate('Conversa', {
        conversaId: r.conversa_id,
        nome: a.nome,
        outroTipo: 'aluno',
        outroId: a.id,
      });
    },
    onError: (e) =>
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível abrir a conversa.'),
  });

  if (q.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />;
  if (q.isError)
    return (
      <Pressable onPress={() => q.refetch()} style={styles.alvo}>
        <Text style={styles.erroTxt}>Erro ao carregar interessados. Toque para tentar de novo.</Text>
      </Pressable>
    );
  if (!q.data?.length) return <Text style={styles.vazioTxt}>Nenhum aluno interessado ainda.</Text>;

  return (
    <View style={styles.lista}>
      {q.data.map((a) => (
        <View key={a.id} style={styles.interessadoLinha}>
          <View style={{ flex: 1 }}>
            <Text style={styles.interessadoNome}>{a.nome}</Text>
            <Text style={styles.meta}>
              {[a.curso, a.semestre ? `${a.semestre}º sem.` : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Pressable
            style={[styles.conversar, abrindoId === a.id && { opacity: 0.6 }]}
            disabled={abrindoId !== null}
            onPress={() => conversar.mutate({ id: a.id, nome: a.nome })}
            accessibilityRole="button"
            accessibilityLabel={`Conversar com ${a.nome}. O aluno será marcado como contatado nos favoritos.`}
          >
            {abrindoId === a.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.conversarTxt}>Conversar</Text>
            )}
          </Pressable>
        </View>
      ))}
      <Text style={styles.ajuda}>Ao conversar, o aluno é marcado como "contatado" nos seus favoritos.</Text>
    </View>
  );
}

export function EmpVagasScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['vagas-emp', id], queryFn: () => getVagasEmpresa(id) });
  const [aberta, setAberta] = useState<number | null>(null);

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
        <View key={v.id}>
        <Pressable
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
              <Pressable
                style={styles.alvo}
                disabled={!v.interessados}
                onPress={() => setAberta(aberta === v.id ? null : v.id)}
                accessibilityRole="button"
                accessibilityLabel="Ver alunos interessados"
              >
                <Text style={styles.interessados}>
                  {v.interessados} {v.interessados === 1 ? 'aluno interessado' : 'alunos interessados'}
                  {v.interessados ? (aberta === v.id ? ' ▴' : ' ▾') : ''}
                </Text>
              </Pressable>
              <Text style={styles.editar}>Editar ›</Text>
            </View>
          </Card>
        </Pressable>
        {aberta === v.id && <Interessados empresaId={id} vagaId={v.id} />}
        </View>
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
  alvo: { minHeight: 44, justifyContent: 'center' },
  lista: { paddingHorizontal: spacing.sm, gap: spacing.sm, marginTop: spacing.sm },
  interessadoLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  interessadoNome: { ...typography.small, color: colors.text, fontWeight: '700' },
  conversar: {
    minHeight: 44, minWidth: 96, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md,
  },
  conversarTxt: { ...typography.small, color: '#fff', fontWeight: '700' },
  ajuda: { ...typography.tiny, color: colors.textMuted },
  vazioTxt: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  erroTxt: { ...typography.small, color: colors.danger },
  editar: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
});
