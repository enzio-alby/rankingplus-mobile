import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getContratacoes } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

function data(s: string | null) {
  return s ? new Date(s).toLocaleDateString('pt-BR') : '—';
}

export function ContratacoesScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const q = useQuery({ queryKey: ['contratacoes', id], queryFn: () => getContratacoes(id) });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Contratações</Titulo>
      <Text style={styles.sub}>Acompanhe a retenção com check-ins trimestrais.</Text>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar contratações.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma contratação registrada. Marque um favorito como “Contratado”."
        onRetry={q.refetch}
      />
      {q.data?.map((c) => {
        const respondido = c.respondido_em != null;
        const continua = c.continua_na_empresa === 1;
        return (
          <Card key={c.aluno_id}>
            <Text style={styles.nome}>{c.aluno_nome}</Text>
            <Text style={styles.meta}>Contratado em {data(c.marcado_contratado_em)}</Text>
            {respondido ? (
              <View style={[styles.badge, { backgroundColor: (continua ? colors.success : colors.danger) + '22' }]}>
                <Text style={[styles.badgeTxt, { color: continua ? colors.success : colors.danger }]}>
                  {continua ? 'Continua na empresa' : 'Saiu da empresa'}
                </Text>
              </View>
            ) : (
              <View style={styles.pendente}>
                <Text style={styles.pendenteTxt}>Check-in pendente</Text>
                <Text style={styles.meta}>Próximo: {data(c.proximo_checkin_em)}</Text>
              </View>
            )}
          </Card>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sub: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  nome: { ...typography.h3, color: colors.text },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, marginTop: spacing.sm },
  badgeTxt: { ...typography.small, fontWeight: '700' },
  pendente: { marginTop: spacing.sm },
  pendenteTxt: { ...typography.small, color: colors.warning, fontWeight: '700' },
});
