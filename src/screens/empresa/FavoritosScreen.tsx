import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getFavoritos, mudarStatusFavorito, desfavoritar } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { STATUS_FAVORITO, type StatusFavorito } from '@/api_mobile';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const ROTULO: Record<StatusFavorito, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  entrevista_marcada: 'Entrevista',
  contratado: 'Contratado',
  descartado: 'Descartado',
};
const COR: Record<StatusFavorito, string> = {
  novo: colors.textMuted,
  contatado: '#2563EB',
  entrevista_marcada: colors.warning,
  contratado: colors.success,
  descartado: colors.danger,
};

export function FavoritosScreen() {
  const { sessao } = useSession();
  const empId = sessao?.id ?? 0;
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['favoritos', empId], queryFn: () => getFavoritos(empId) });

  const mudar = useMutation({
    mutationFn: (v: { alunoId: number; status: StatusFavorito }) =>
      mudarStatusFavorito(empId, v.alunoId, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favoritos', empId] }),
    onError: () => Alert.alert('Erro', 'Não foi possível mudar o status.'),
  });
  const remover = useMutation({
    mutationFn: (alunoId: number) => desfavoritar(empId, alunoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favoritos', empId] }),
  });

  const grupos = STATUS_FAVORITO.map((s) => ({
    status: s,
    itens: (q.data ?? []).filter((f) => f.status === s),
  })).filter((g) => g.itens.length > 0);

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Favoritos</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar favoritos.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhum candidato favoritado ainda. Favorite no Portal de Talentos."
        onRetry={q.refetch}
      />

      {grupos.map((g) => (
        <View key={g.status} style={{ gap: spacing.sm }}>
          <View style={styles.grupoHead}>
            <View style={[styles.dot, { backgroundColor: COR[g.status] }]} />
            <Text style={styles.grupoTit}>
              {ROTULO[g.status]} · {g.itens.length}
            </Text>
          </View>
          {g.itens.map((f) => {
            const idx = STATUS_FAVORITO.indexOf(f.status);
            const prox = STATUS_FAVORITO[(idx + 1) % STATUS_FAVORITO.length];
            return (
              <Card key={f.id}>
                <View style={styles.linha}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{f.nome}</Text>
                    <Text style={styles.sub}>
                      {[f.curso, f.semestre ? `${f.semestre}º sem.` : null].filter(Boolean).join(' · ')}
                      {f.media_geral != null ? ` · CRA ${f.media_geral}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => remover.mutate(f.id)} hitSlop={10}>
                    <Text style={styles.remover}>✕</Text>
                  </Pressable>
                </View>
                <View style={styles.acoes}>
                  <Pressable
                    style={[styles.mover, { borderColor: COR[prox] }]}
                    onPress={() => mudar.mutate({ alunoId: f.id, status: prox })}
                  >
                    <Text style={[styles.moverTxt, { color: COR[prox] }]}>→ {ROTULO[prox]}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  grupoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  grupoTit: { ...typography.h3, color: colors.text },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nome: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  remover: { color: colors.textMuted, fontSize: 16, padding: 2 },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  mover: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: spacing.md },
  moverTxt: { ...typography.small, fontWeight: '700' },
});
