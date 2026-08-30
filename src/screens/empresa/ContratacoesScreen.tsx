import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Linking, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getContratacoes, getInfoContratado } from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

function data(s: string | null) {
  return s ? new Date(s).toLocaleDateString('pt-BR') : '—';
}

export function ContratacoesScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const ehDemo = !!sessao?.demo;
  const q = useQuery({ queryKey: ['contratacoes', id], queryFn: () => getContratacoes(id) });
  const [sel, setSel] = useState<{ alunoId: number; nome: string } | null>(null);

  return (
    <>
      <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
        <Titulo>Contratações</Titulo>
        <Text style={styles.sub}>Toque num contratado para ver os dados dele e a vaga do processo.</Text>
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
            <Pressable
              key={c.aluno_id}
              onPress={() => setSel({ alunoId: c.aluno_id, nome: c.aluno_nome })}
              accessibilityRole="button"
              accessibilityLabel={`Ver dados de ${c.aluno_nome}`}
            >
              <Card>
                <View style={styles.linhaTopo}>
                  <Text style={styles.nome}>{c.aluno_nome}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
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
            </Pressable>
          );
        })}
      </ScreenScroll>

      <ContratadoModal
        empresaId={id}
        alunoId={sel?.alunoId ?? null}
        nome={sel?.nome ?? ''}
        ehDemo={ehDemo}
        onClose={() => setSel(null)}
      />
    </>
  );
}

function ContratadoModal({
  empresaId,
  alunoId,
  nome,
  ehDemo,
  onClose,
}: {
  empresaId: number;
  alunoId: number | null;
  nome: string;
  ehDemo: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: ['info-contratado', empresaId, alunoId],
    queryFn: () => getInfoContratado(empresaId, alunoId as number),
    enabled: alunoId != null,
  });
  const d = q.data;

  return (
    <Modal visible={alunoId != null} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.mHead, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.mNome}>{d?.nome || nome || 'Contratado'}</Text>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fechar">
          <Text style={styles.mClose}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.mBody}>
        <Estado
          carregando={q.isLoading}
          erro={q.isError ? 'Não foi possível carregar os dados.' : null}
          onRetry={q.refetch}
        />

        {d && (
          <>
            {(d.curso || d.semestre) && (
              <Text style={styles.mSub}>
                {[d.curso, d.semestre ? `${d.semestre}º sem.` : null].filter(Boolean).join(' · ')}
              </Text>
            )}

            <Text style={styles.secao}>Contato</Text>
            <Card>
              <Contato
                icon="mail-outline"
                label="E-mail"
                valor={d.email}
                href={d.email ? `mailto:${d.email}` : null}
                ehDemo={ehDemo}
              />
              <Contato
                icon="call-outline"
                label="Telefone"
                valor={d.telefone}
                href={d.telefone ? `tel:${d.telefone.replace(/[^\d+]/g, '')}` : null}
                ehDemo={ehDemo}
              />
              <Contato
                icon="logo-linkedin"
                label="LinkedIn"
                valor={d.linkedin}
                href={d.linkedin ? normalizarUrl(d.linkedin) : null}
                ehDemo={ehDemo}
              />
              <Contato
                icon="logo-github"
                label="GitHub"
                valor={d.github}
                href={d.github ? normalizarUrl(d.github) : null}
                ehDemo={ehDemo}
              />
              {ehDemo && (
                <Text style={styles.lgpd}>
                  Modo demonstração: os contatos aparecem, mas não abrem. Com conta real, cada um
                  leva ao e-mail / discador / navegador.
                </Text>
              )}
            </Card>

            <Text style={styles.secao}>Vaga do processo</Text>
            <Card>
              {d.vagas.length === 0 ? (
                <Text style={styles.vazioVaga}>
                  Nenhuma vaga vinculada — a contratação foi marcada direto pelos favoritos.
                </Text>
              ) : (
                d.vagas.map((v) => (
                  <View key={v.id} style={styles.vaga}>
                    <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                    <Text style={styles.vagaTxt}>{v.titulo}</Text>
                  </View>
                ))
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}

function normalizarUrl(v: string) {
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Mostra o valor do contato. Logado de verdade abre no app certo; na demo
 *  aparece mas não é clicável. */
function Contato({
  icon,
  label,
  valor,
  href,
  ehDemo,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  valor: string | null;
  href: string | null;
  ehDemo: boolean;
}) {
  const clicavel = !!href && !ehDemo;
  const abrir = () => {
    if (href) Linking.openURL(href).catch(() => Alert.alert(label, valor ?? '—'));
  };

  const conteudo = (
    <>
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ width: 22 }} />
      <Text style={styles.contatoLabel}>{label}</Text>
      <Text style={[styles.contatoValor, clicavel && styles.link]} numberOfLines={1}>
        {valor || '—'}
      </Text>
    </>
  );

  if (!clicavel) {
    return (
      <View style={styles.contato} accessibilityLabel={`${label}: ${valor ?? 'não informado'}`}>
        {conteudo}
      </View>
    );
  }
  return (
    <Pressable
      style={styles.contato}
      onPress={abrir}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${valor}`}
    >
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sub: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nome: { ...typography.h3, color: colors.text, flex: 1 },
  meta: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, marginTop: spacing.sm },
  badgeTxt: { ...typography.small, fontWeight: '700' },
  pendente: { marginTop: spacing.sm },
  pendenteTxt: { ...typography.small, color: colors.warning, fontWeight: '700' },
  mHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mNome: { ...typography.h2, color: colors.text, flex: 1 },
  mClose: { fontSize: 20, color: colors.textMuted },
  mBody: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.bgMuted, paddingBottom: spacing.xxl },
  mSub: { ...typography.small, color: colors.textMuted },
  secao: {
    ...typography.tiny, color: colors.textMuted, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md,
  },
  contato: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  contatoLabel: { ...typography.small, color: colors.textMuted, width: 78 },
  contatoValor: { ...typography.small, color: colors.text, flex: 1, textAlign: 'right' },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  lgpd: {
    ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, lineHeight: 15,
  },
  vaga: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  vagaTxt: { ...typography.body, color: colors.text, flex: 1 },
  vazioVaga: { ...typography.small, color: colors.textMuted },
});
