import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getContatos, abrirConversa, type Contato } from '@/api/chat';
import { ScreenScroll, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';
import type { Papel } from '@/types/api';

type Item = Contato & { tipo: Papel };

export function NovaConversaScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const qc = useQueryClient();
  const meuTipo = sessao!.tipo;
  const meuId = sessao!.id;
  const [busca, setBusca] = useState('');

  const q = useQuery({
    queryKey: ['contatos', meuTipo, meuId],
    queryFn: () => getContatos(meuTipo, meuId),
  });

  const abrir = useMutation({
    mutationFn: (c: Item) => abrirConversa(meuTipo, meuId, c.tipo, c.id, c.nome),
    onSuccess: (r, c) => {
      qc.invalidateQueries({ queryKey: ['conversas'] });
      nav.replace('Conversa', {
        conversaId: r.conversa_id,
        nome: c.nome,
        outroTipo: c.tipo,
        outroId: c.id,
      });
    },
    onError: (e) =>
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível abrir a conversa.'),
  });

  const listas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtra = (arr: Contato[] = []) =>
      arr.filter((c) => !termo || c.nome.toLowerCase().includes(termo));
    return {
      professores: filtra(q.data?.professores).map((c) => ({ ...c, tipo: 'professor' as Papel })),
      alunos: filtra(q.data?.alunos).map((c) => ({ ...c, tipo: 'aluno' as Papel })),
    };
  }, [q.data, busca]);

  const vazio =
    !q.isLoading && listas.professores.length === 0 && listas.alunos.length === 0;

  function Linha({ c }: { c: Item }) {
    const bloqueado = c.tipo === 'aluno' && c.permite_contato === false;
    return (
      <Pressable
        disabled={bloqueado || abrir.isPending}
        onPress={() => abrir.mutate(c)}
        accessibilityRole="button"
        accessibilityLabel={
          bloqueado ? `${c.nome} não aceita mensagens` : `Conversar com ${c.nome}`
        }
      >
        <Card style={bloqueado ? styles.cardOff : undefined}>
          <View style={styles.linha}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{(c.nome || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome} numberOfLines={1}>
                {c.nome}
              </Text>
              {bloqueado && <Text style={styles.off}>não aceita mensagens de colegas</Text>}
            </View>
            {abrir.isPending && abrir.variables?.id === c.id && abrir.variables?.tipo === c.tipo ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              !bloqueado && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.buscaBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.busca}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
      </View>

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar os contatos.' : null}
        vazio={vazio}
        vazioTexto="Ninguém encontrado."
        onRetry={q.refetch}
      />

      {listas.professores.length > 0 && (
        <>
          <Text style={styles.secao}>Professores</Text>
          {listas.professores.map((c) => (
            <Linha key={`p-${c.id}`} c={c} />
          ))}
        </>
      )}

      {listas.alunos.length > 0 && (
        <>
          <Text style={styles.secao}>{meuTipo === 'professor' ? 'Alunos' : 'Colegas'}</Text>
          {listas.alunos.map((c) => (
            <Linha key={`a-${c.id}`} c={c} />
          ))}
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  buscaBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
  },
  busca: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text },
  secao: {
    ...typography.tiny, color: colors.textMuted, fontWeight: '800', letterSpacing: 0.6,
    textTransform: 'uppercase', marginTop: spacing.md, marginBottom: 2,
  },
  cardOff: { opacity: 0.55 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  nome: { ...typography.body, color: colors.text, fontWeight: '600' },
  off: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
});
