import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, FlatList, Modal, Linking, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { useHeaderHeight } from '@react-navigation/elements';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/auth/session';
import {
  getMensagens, enviarMensagem, enviarAnexoChat, ehImagem, ANEXO_MAX_BYTES, type Mensagem,
} from '@/api/chat';
import { getToken } from '@/api/client';
import { getVagasDeInteresse } from '@/api/empresa';
import { baixarEAbrirAnexo, urlAnexo, tamanhoLegivel } from '@/lib/anexos';
import { Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversa'>;

const CHIPS = [
  'Podemos agendar uma conversa?',
  'Obrigado pelo retorno!',
  'Fico no aguardo.',
];

const EMOJIS = ['👍', '🙂', '🙏', '🎯', '✅', '🚀', '📅', '❓'];
const URL_SPLIT = /(https?:\/\/[^\s]+)/gi; // só pra split (com grupo de captura)
const URL_TESTE = /^https?:\/\/[^\s]+$/i; // teste ancorado, sem estado (/g)

/** Quebra o texto em pedaços, transformando URLs em toque -> abre no navegador. */
function TextoComLinks({ texto, eu }: { texto: string; eu: boolean }) {
  const partes = texto.split(URL_SPLIT);
  return (
    <Text style={[styles.txt, eu && styles.txtEu]}>
      {partes.map((p, i) =>
        URL_TESTE.test(p) ? (
          <Text
            key={i}
            style={[styles.link, eu && styles.linkEu]}
            onPress={() => Linking.openURL(p).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link.'))}
          >
            {p}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

export function ConversaScreen({ route }: Props) {
  const { sessao } = useSession();
  const qc = useQueryClient();
  const headerHeight = useHeaderHeight();
  const ehDemo = !!sessao?.demo;
  const { conversaId, outroTipo, outroId } = route.params;
  const [texto, setTexto] = useState('');
  const [anexando, setAnexando] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
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
    mutationFn: (v: { t: string; anexoId?: number }) =>
      enviarMensagem(conversaId, sessao!.tipo, sessao!.id, v.t, v.anexoId),
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

  function abrirAnexoMenu() {
    if (ehDemo) {
      Alert.alert(
        'Somente com conta real',
        'Enviar arquivos e links no chat fica disponível quando você entra com sua conta. No modo demonstração o botão aparece só pra você ver onde fica.',
      );
      return;
    }
    Alert.alert('Anexar', 'O que você quer enviar?', [
      { text: 'Foto / imagem', onPress: () => anexarArquivo('image/*') },
      { text: 'Arquivo PDF', onPress: () => anexarArquivo('application/pdf') },
      { text: 'Link', onPress: () => { setLinkUrl(''); setLinkModal(true); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function anexarArquivo(filtro: 'application/pdf' | 'image/*') {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: filtro, copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      if ((a.size ?? 0) > ANEXO_MAX_BYTES) {
        Alert.alert('Arquivo grande demais', 'O limite para anexo é 5 MB.');
        return;
      }
      const mime = a.mimeType || (filtro === 'application/pdf' ? 'application/pdf' : 'image/jpeg');
      setAnexando(true);
      const up = await enviarAnexoChat(a.uri, a.name, mime);
      await enviarMensagem(conversaId, sessao!.tipo, sessao!.id, texto.trim(), up.anexo_id);
      setTexto('');
      qc.invalidateQueries({ queryKey: ['mensagens', conversaId] });
      qc.invalidateQueries({ queryKey: ['conversas'] });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível anexar o arquivo.');
    } finally {
      setAnexando(false);
    }
  }

  function enviarLink() {
    const url = linkUrl.trim();
    if (!url) return;
    const normal = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setLinkModal(false);
    enviar.mutate({ t: texto.trim() ? `${texto.trim()} ${normal}` : normal });
  }

  async function abrirAnexo(m: Mensagem) {
    if (!m.anexo || m.anexo.expirado) return;
    try {
      await baixarEAbrirAnexo(m.anexo.id, m.anexo.nome);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível abrir o anexo.');
    }
  }

  const ocupado = enviar.isPending || anexando;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
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
            const anexo = item.anexo;
            const imagem = anexo && !anexo.expirado && ehImagem(anexo.nome);
            return (
              <View style={[styles.bolha, eu ? styles.bolhaEu : styles.bolhaOutro]}>
                {anexo && imagem && (
                  <Pressable
                    onPress={() => abrirAnexo(item)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`Abrir imagem ${anexo.nome}`}
                  >
                    <Image
                      source={{
                        uri: urlAnexo(anexo.id),
                        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
                      }}
                      style={styles.anexoImg}
                      resizeMode="cover"
                    />
                  </Pressable>
                )}
                {anexo && !imagem && (
                  <Pressable
                    style={[styles.anexo, eu && styles.anexoEu]}
                    onPress={() => abrirAnexo(item)}
                    disabled={anexo.expirado}
                    accessibilityRole="button"
                    accessibilityLabel={
                      anexo.expirado ? `Anexo ${anexo.nome} expirado` : `Abrir anexo ${anexo.nome}`
                    }
                  >
                    <Ionicons
                      name={ehImagem(anexo.nome) ? 'image' : 'document-text'}
                      size={20}
                      color={eu ? '#fff' : colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.anexoNome, eu && styles.txtEu]} numberOfLines={1}>
                        {anexo.nome}
                      </Text>
                      <Text style={[styles.anexoMeta, eu && styles.horaEu]}>
                        {anexo.expirado
                          ? 'expirado'
                          : `${ehImagem(anexo.nome) ? 'Imagem' : 'PDF'} · ${tamanhoLegivel(anexo.tamanho_bytes)} · tocar p/ abrir`}
                      </Text>
                    </View>
                  </Pressable>
                )}
                {!!item.texto && <TextoComLinks texto={item.texto} eu={eu} />}
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
        <Pressable
          style={styles.anexoBtn}
          onPress={abrirAnexoMenu}
          disabled={ocupado}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Anexar arquivo ou link"
        >
          {anexando ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="attach" size={24} color={ocupado ? colors.textMuted : colors.primary} />
          )}
        </Pressable>

        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensagem…"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Pressable
          style={[styles.enviar, (!texto.trim() || ocupado) && { opacity: 0.5 }]}
          disabled={!texto.trim() || ocupado}
          onPress={() => enviar.mutate({ t: texto.trim() })}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{ disabled: !texto.trim() || ocupado }}
        >
          {enviar.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.enviarTxt}>➤</Text>}
        </Pressable>
      </View>

      <Modal visible={linkModal} transparent animationType="fade" onRequestClose={() => setLinkModal(false)}>
        <Pressable style={styles.mOverlay} onPress={() => setLinkModal(false)}>
          <View style={styles.mSheet}>
            <Text style={styles.mTitulo}>Anexar link</Text>
            <TextInput
              style={styles.mInput}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              autoFocus
              onSubmitEditing={enviarLink}
            />
            <View style={styles.mBtns}>
              <Pressable onPress={() => setLinkModal(false)} style={styles.mBtn}>
                <Text style={styles.mBtnTxt}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={enviarLink} style={[styles.mBtn, styles.mBtnPrim]}>
                <Text style={[styles.mBtnTxt, { color: '#fff' }]}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  bolha: { maxWidth: '82%', borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  bolhaEu: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bolhaOutro: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  txt: { ...typography.body, color: colors.text },
  txtEu: { color: '#fff' },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  linkEu: { color: '#fff' },
  hora: { ...typography.tiny, color: colors.textMuted, marginTop: 3, alignSelf: 'flex-end' },
  horaEu: { color: 'rgba(255,255,255,0.7)' },
  anexo: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgMuted, borderRadius: radius.md, padding: spacing.sm,
    marginBottom: 4, minWidth: 200,
  },
  anexoEu: { backgroundColor: 'rgba(255,255,255,0.14)' },
  anexoNome: { ...typography.small, color: colors.text, fontWeight: '600' },
  anexoMeta: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
  anexoImg: {
    width: 200, height: 200, borderRadius: radius.md, marginBottom: 4,
    backgroundColor: colors.bgMuted,
  },
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
  anexoBtn: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
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
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl },
  mSheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  mTitulo: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  mInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  mBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  mBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  mBtnPrim: { backgroundColor: colors.primary },
  mBtnTxt: { ...typography.body, color: colors.textMuted, fontWeight: '700' },
});
