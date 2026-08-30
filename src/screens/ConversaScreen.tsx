import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/auth/session';
import { getMensagens, enviarMensagem, type Mensagem } from '@/api/chat';
import { getVagasDeInteresse } from '@/api/empresa';
import { Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversa'>;

const CHIPS = [
  'Podemos agendar uma conversa?',
  'Obrigado pelo retorno!',
  'Fico no aguardo.',
];

const EMOJIS = ['👍', '🙂', '🙏', '🎯', '✅', '🚀', '📅', '❓'];

export function ConversaScreen({ route }: Props) {
  const { sessao } = useSession();
  const qc = useQueryClient();
  const { conversaId, outroTipo, outroId } = route.params;
  const [texto, setTexto] = useState('');
  const listRef = useRef<FlatList<Mensagem>>(null);

  const q = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: () => getMensagens(conversaId),
    refetchInterval: 5000,
  });

  // Empresa conversando com aluno: mostra em qual(is) vaga(s) o aluno tem interesse.
  const empChat = sessao?.tipo === 'empresa' && outroTipo === 'aluno' && !!outroId;
  const vagas = useQuery({
    queryKey: ['conversa-vagas', sessao?.id, outroId],
    queryFn: () => getVagasDeInteresse(sessao!.id, outroId as number),
    enabled: empChat,
  });

  const enviar = useMutation({
    mutationFn: (t: string) => enviarMensagem(conversaId, sessao!.tipo, sessao!.id, t),
    onSuccess: () => {
      setTexto('');
      qc.invalidateQueries({ queryKey: ['mensagens', conversaId] });
      qc.invalidateQueries({ queryKey: ['conversas'] });
    },
    onError: (e) =>
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar.'),
  });

  useEffect(() => {
    if (q.data?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [q.data?.length]);

  function souEu(m: Mensagem) {
    return m.remetente_tipo === sessao?.tipo && Number(m.remetente_id) === Number(sessao?.id);
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {empChat && vagas.data && vagas.data.length > 0 && (
        <View style={styles.vagaBanner}>
          <Text style={styles.vagaLbl}>
            Interesse {vagas.data.length > 1 ? 'nas vagas' : 'na vaga'}:
          </Text>
          <Text style={styles.vagaTxt}>{vagas.data.map((v) => v.titulo).join(' · ')}</Text>
        </View>
      )}

      {q.isLoading ? (
        <Estado carregando />
      ) : (
        <FlatList
          ref={listRef}
          data={q.data ?? []}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vazio}>Sem mensagens ainda. Diga oi 👋</Text>}
          renderItem={({ item }) => {
            const eu = souEu(item);
            return (
              <View style={[styles.bolha, eu ? styles.bolhaEu : styles.bolhaOutro]}>
                <Text style={[styles.txt, eu && styles.txtEu]}>{item.texto}</Text>
                <Text style={[styles.hora, eu && styles.horaEu]}>
                  {new Date(item.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.emojiRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setTexto((t) => t + e)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar emoji ${e} à mensagem`}
          >
            <Text style={styles.emoji}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chips}>
        {CHIPS.map((c) => (
          <Pressable
            key={c}
            style={styles.chip}
            onPress={() => setTexto(c)}
            accessibilityRole="button"
            accessibilityLabel={`Usar resposta rápida: ${c}`}
          >
            <Text style={styles.chipTxt}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.barra}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensagem…"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Pressable
          style={[styles.enviar, (!texto.trim() || enviar.isPending) && { opacity: 0.5 }]}
          disabled={!texto.trim() || enviar.isPending}
          onPress={() => enviar.mutate(texto.trim())}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{ disabled: !texto.trim() || enviar.isPending }}
        >
          {enviar.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.enviarTxt}>➤</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  vagaBanner: {
    backgroundColor: colors.accent + '18',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  vagaLbl: { ...typography.tiny, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  vagaTxt: { ...typography.small, color: colors.text, marginTop: 2 },
  lista: { padding: spacing.lg, gap: spacing.sm },
  vazio: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  bolha: { maxWidth: '80%', borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  bolhaEu: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bolhaOutro: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  txt: { ...typography.body, color: colors.text },
  txtEu: { color: '#fff' },
  hora: { ...typography.tiny, color: colors.textMuted, marginTop: 3, alignSelf: 'flex-end' },
  horaEu: { color: 'rgba(255,255,255,0.7)' },
  emojiRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.xs,
  },
  emoji: { fontSize: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingVertical: 5, paddingHorizontal: spacing.md, backgroundColor: colors.surface,
  },
  chipTxt: { ...typography.tiny, color: colors.textMuted },
  barra: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100,
    fontSize: 15, color: colors.text,
  },
  enviar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  enviarTxt: { color: '#fff', fontSize: 18 },
});
