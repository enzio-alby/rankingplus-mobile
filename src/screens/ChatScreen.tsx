import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getConversas } from '@/api/chat';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const ROTULO_TIPO: Record<string, string> = { aluno: 'Aluno', professor: 'Professor', empresa: 'Empresa' };

export function ChatScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const q = useQuery({
    queryKey: ['conversas', sessao?.tipo, sessao?.id],
    queryFn: () => getConversas(sessao!.tipo, sessao!.id),
    refetchInterval: 6000,
  });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Mensagens</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar conversas.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma conversa ainda."
        onRetry={q.refetch}
      />
      {q.data?.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => nav.navigate('Conversa', { conversaId: c.id, nome: c.outro_nome })}
        >
          <Card>
            <View style={styles.linha}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{(c.outro_nome || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={1}>
                  {c.outro_nome}
                  <Text style={styles.tag}>  {ROTULO_TIPO[c.outro_tipo] ?? c.outro_tipo}</Text>
                </Text>
                <Text style={styles.previa} numberOfLines={1}>
                  {c.previa || '—'}
                </Text>
              </View>
              {c.nao_lidas > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{c.nao_lidas}</Text>
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  nome: { ...typography.body, color: colors.text, fontWeight: '600' },
  tag: { ...typography.tiny, color: colors.textMuted, fontWeight: '400' },
  previa: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: colors.accent, borderRadius: radius.pill,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
