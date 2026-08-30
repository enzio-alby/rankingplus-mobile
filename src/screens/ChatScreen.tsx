import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

  // Só aluno e professor podem iniciar conversa (o backend recusa empresa).
  const podeIniciar = sessao?.tipo === 'aluno' || sessao?.tipo === 'professor';

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.top}>
        <Titulo>Mensagens</Titulo>
        {podeIniciar && (
          <Pressable
            style={styles.novo}
            onPress={() => nav.navigate('NovaConversa')}
            accessibilityRole="button"
            accessibilityLabel="Iniciar nova conversa"
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.novoTxt}>Nova</Text>
          </Pressable>
        )}
      </View>
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
          onPress={() =>
            nav.navigate('Conversa', {
              conversaId: c.id,
              nome: c.outro_nome,
              outroTipo: c.outro_tipo,
              outroId: c.outro_id,
            })
          }
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  novo: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  novoTxt: { ...typography.small, color: '#fff', fontWeight: '700' },
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
