import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getVagasDisponiveis } from '@/api/professor';
import { modoLocal } from '@/api/mode';
import { Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const LIMITE_RESUMO = 140;

export function ProfVagasScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const [busca, setBusca] = useState('');
  const [expandidas, setExpandidas] = useState<Record<number, boolean>>({});
  const q = useQuery({ queryKey: ['prof-vagas', id], queryFn: () => getVagasDisponiveis(id) });

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const lista = q.data ?? [];
    if (!t) return lista;
    return lista.filter((v) =>
      [v.titulo, v.empresa_nome, v.curso_preferido].some((c) => (c ?? '').toLowerCase().includes(t)),
    );
  }, [q.data, busca]);

  const semVagas = !q.isLoading && !q.isError && (q.data?.length ?? 0) === 0;
  const textoVazio = modoLocal()
    ? 'Disponível ao entrar com sua conta.'
    : 'Nenhuma vaga aberta no momento.';

  return (
    <FlatList
      data={q.isLoading || q.isError ? [] : filtradas}
      keyExtractor={(v) => String(v.id)}
      style={{ backgroundColor: colors.bgMuted }}
      contentContainerStyle={styles.lista}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.sub}>Vagas abertas das empresas parceiras, para você recomendar a seus alunos.</Text>
          <TextInput
            style={styles.busca}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por título, empresa ou curso"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
          />
          <Estado
            carregando={q.isLoading}
            erro={q.isError ? 'Erro ao carregar vagas.' : null}
            vazio={semVagas}
            vazioTexto={textoVazio}
            onRetry={q.refetch}
          />
          {!q.isLoading && !q.isError && !semVagas && filtradas.length === 0 && (
            <Text style={styles.nenhum}>Nenhuma vaga encontrada para "{busca}".</Text>
          )}
        </View>
      }
      renderItem={({ item: v }) => {
        const desc = v.descricao ?? '';
        const longa = desc.length > LIMITE_RESUMO;
        const aberta = !!expandidas[v.id];
        return (
          <Card>
            <Text style={styles.titulo}>{v.titulo}</Text>
            {v.empresa_nome ? <Text style={styles.emp}>{v.empresa_nome}</Text> : null}
            {(v.curso_preferido || v.semestre_minimo) && (
              <Text style={styles.meta}>
                {[v.curso_preferido, v.semestre_minimo ? `${v.semestre_minimo}º sem. mínimo` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            {desc ? (
              <Text style={styles.desc}>
                {longa && !aberta ? desc.slice(0, LIMITE_RESUMO).trimEnd() + '…' : desc}
              </Text>
            ) : null}
            {longa && (
              <Pressable
                style={styles.verMais}
                onPress={() => setExpandidas((e) => ({ ...e, [v.id]: !aberta }))}
                accessibilityRole="button"
              >
                <Text style={styles.verMaisTxt}>{aberta ? 'Ver menos' : 'Ver mais'}</Text>
              </Pressable>
            )}
            <Text style={styles.idVaga}>Vaga #{v.id}</Text>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  sub: { ...typography.small, color: colors.textMuted },
  busca: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  nenhum: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  titulo: { ...typography.h3, color: colors.text },
  emp: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  desc: { ...typography.small, color: colors.text, marginTop: spacing.sm },
  verMais: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  verMaisTxt: { ...typography.small, color: colors.accent, fontWeight: '700' },
  idVaga: { ...typography.tiny, color: colors.textMuted },
});
