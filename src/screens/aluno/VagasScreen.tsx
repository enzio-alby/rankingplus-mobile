import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getVagas, toggleInteresse } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

function corFaixa(f?: string) {
  return f === 'alta' ? colors.compatAlta : f === 'media' ? colors.compatMedia : colors.compatBaixa;
}

export function VagasScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['vagas', id], queryFn: () => getVagas(id) });

  const m = useMutation({
    mutationFn: (v: { vagaId: number; ligar: boolean }) => toggleInteresse(id, v.vagaId, v.ligar),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vagas', id] }),
    onError: () => Alert.alert('Erro', 'Não foi possível atualizar o interesse.'),
  });

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Vagas</Titulo>
      <Text style={styles.sub}>Marque interesse — se a empresa também demonstrar, abre um chat.</Text>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar vagas.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhuma vaga aberta no momento."
        onRetry={q.refetch}
      />
      {q.data?.map((v) => {
        const interessado = !!v.tenho_interesse;
        const c = v.compatibilidade;
        return (
          <Card key={v.id}>
            <View style={styles.top}>
              <Text style={styles.titulo}>{v.titulo}</Text>
              {c && (
                <View style={[styles.match, { backgroundColor: corFaixa(c.faixa) + '22' }]}>
                  <Text style={[styles.matchTxt, { color: corFaixa(c.faixa) }]}>{c.score}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.emp}>{v.empresa_nome}</Text>
            {(v.area_foco_nome || v.tipo_vaga_nome) && (
              <Text style={styles.meta}>
                {[v.area_foco_nome, v.tipo_vaga_nome].filter(Boolean).join(' · ')}
              </Text>
            )}
            {v.curso_preferido && (
              <Text style={styles.meta}>
                {v.curso_preferido}
                {v.semestre_minimo ? ` · ${v.semestre_minimo}º sem.+` : ''}
              </Text>
            )}
            {v.descricao ? <Text style={styles.desc}>{v.descricao}</Text> : null}
            <Pressable
              style={[styles.btn, interessado ? styles.btnOn : styles.btnOff]}
              onPress={() => m.mutate({ vagaId: v.id, ligar: !interessado })}
              disabled={m.isPending}
            >
              <Text style={[styles.btnTxt, interessado && styles.btnTxtOn]}>
                {interessado ? '✓ Interesse marcado' : 'Tenho interesse'}
              </Text>
            </Pressable>
          </Card>
        );
      })}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sub: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titulo: { ...typography.h3, color: colors.text, flex: 1 },
  match: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  matchTxt: { ...typography.small, fontWeight: '800' },
  emp: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  desc: { ...typography.small, color: colors.text, marginTop: spacing.sm },
  btn: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md, borderWidth: 1 },
  btnOff: { borderColor: colors.primary },
  btnOn: { borderColor: colors.success, backgroundColor: colors.success + '18' },
  btnTxt: { ...typography.body, color: colors.primary, fontWeight: '700' },
  btnTxtOn: { color: colors.success },
});
