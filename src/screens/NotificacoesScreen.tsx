import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession } from '@/auth/session';
import { getNotificacoes, marcarLida, marcarTodasLidas } from '@/api/notificacoes';
import { getConversas } from '@/api/chat';
import { ScreenScroll, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const ICONE: Record<string, keyof typeof Ionicons.glyphMap> = {
  nova_mensagem: 'chatbubble-ellipses',
  match_vaga: 'flash',
  visualizacao_perfil: 'eye',
  aviso_turma: 'megaphone',
  ranking: 'trophy',
};

function quando(iso: string) {
  const d = new Date(iso);
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `${dias} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}

const TIPO_CONVERSA = ['nova_mensagem', 'match_vaga'];

export function NotificacoesScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const tipo = sessao!.tipo;
  const id = sessao!.id;

  const q = useQuery({
    queryKey: ['notificacoes', tipo, id],
    queryFn: () => getNotificacoes(tipo, id),
  });
  // Pra resolver nome/participante da conversa referenciada por uma notificação.
  const conversas = useQuery({
    queryKey: ['conversas', tipo, id],
    queryFn: () => getConversas(tipo, id),
  });

  function invalidar() {
    qc.invalidateQueries({ queryKey: ['notificacoes', tipo, id] });
    qc.invalidateQueries({ queryKey: ['nao-lidas', tipo, id] });
  }
  const lerUma = useMutation({ mutationFn: (nid: number) => marcarLida(tipo, id, nid), onSuccess: invalidar });
  const lerTodas = useMutation({ mutationFn: () => marcarTodasLidas(tipo, id), onSuccess: invalidar });

  async function abrir(n: { id: number; tipo: string; titulo: string; referencia_id: number | null; lida: number }) {
    if (!Number(n.lida)) lerUma.mutate(n.id);
    if (!TIPO_CONVERSA.includes(n.tipo) || !n.referencia_id) return;
    // Se a lista de conversas ainda não carregou, busca agora — senão o header
    // abriria com o título da notificação em vez do nome do outro participante.
    let lista = conversas.data;
    if (!lista) lista = (await conversas.refetch()).data ?? [];
    const c = lista.find((x) => x.id === n.referencia_id);
    nav.navigate('Conversa', {
      conversaId: n.referencia_id,
      nome: c?.outro_nome ?? n.titulo,
      outroTipo: c?.outro_tipo,
      outroId: c?.outro_id,
    });
  }

  const temNaoLida = (q.data ?? []).some((n) => !Number(n.lida));

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      {temNaoLida && (
        <Pressable style={styles.top} onPress={() => lerTodas.mutate()}>
          <Text style={styles.marcar}>Marcar todas como lidas</Text>
        </Pressable>
      )}

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar notificações.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma notificação."
        onRetry={q.refetch}
      />

      {q.data?.map((n) => {
        const lida = !!Number(n.lida);
        const abreConversa = TIPO_CONVERSA.includes(n.tipo) && !!n.referencia_id;
        return (
          <Pressable key={n.id} onPress={() => abrir(n)}>
            <Card style={lida ? undefined : styles.naoLida}>
              <View style={styles.linha}>
                <View style={[styles.icon, !lida && { backgroundColor: colors.accent + '22' }]}>
                  <Ionicons
                    name={ICONE[n.tipo] ?? 'notifications'}
                    size={16}
                    color={lida ? colors.textMuted : colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.titulo, !lida && { fontWeight: '700' }]}>{n.titulo}</Text>
                  <Text style={styles.msg}>{n.mensagem}</Text>
                  <Text style={styles.quando}>
                    {quando(n.criado_em)}
                    {abreConversa ? '  ·  abrir conversa →' : ''}
                  </Text>
                </View>
                {!lida && <View style={styles.dot} />}
              </View>
            </Card>
          </Pressable>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  top: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  marcar: { ...typography.small, color: colors.accent, fontWeight: '700' },
  naoLida: { borderColor: colors.accent + '55' },
  linha: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  titulo: { ...typography.body, color: colors.text },
  msg: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  quando: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
});
