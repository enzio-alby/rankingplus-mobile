import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { salvarAvatar, removerAvatar, AVATAR_MAX_BYTES, type TipoAvatar } from '@/api/avatar';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  tipo: TipoAvatar;
  id: number;
  inicial: string;
  /** foto vinda do servidor (data URI) ou null */
  avatarAtual?: string | null;
  tamanho?: number;
};

/** Avatar do perfil: foto (se houver) ou inicial, com botões Alterar/Remover foto. */
export function AvatarPerfil({ tipo, id, inicial, avatarAtual, tamanho = 68 }: Props) {
  const [foto, setFoto] = useState<string | null>(avatarAtual ?? null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setFoto(avatarAtual ?? null);
  }, [avatarAtual]);

  async function alterar() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const arquivo = new File(a.uri);
      const tamanhoBytes = a.size ?? arquivo.size ?? 0;
      if (tamanhoBytes > AVATAR_MAX_BYTES) {
        Alert.alert('Imagem grande demais', 'Escolha uma foto de até 1 MB.');
        return;
      }
      const mime = a.mimeType && a.mimeType.startsWith('image/') ? a.mimeType : 'image/jpeg';
      setOcupado(true);
      const b64 = await arquivo.base64();
      const dataUri = `data:${mime};base64,${b64}`;
      await salvarAvatar(tipo, id, dataUri);
      setFoto(dataUri);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar a foto.');
    } finally {
      setOcupado(false);
    }
  }

  async function remover() {
    setOcupado(true);
    try {
      await removerAvatar(tipo, id);
      setFoto(null);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível remover a foto.');
    } finally {
      setOcupado(false);
    }
  }

  const caixa = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  return (
    <View style={styles.wrap}>
      <View style={[styles.avatar, caixa]}>
        {foto ? (
          <Image source={{ uri: foto }} style={caixa} accessibilityLabel="Foto de perfil" />
        ) : (
          <Text style={styles.inicial}>{inicial}</Text>
        )}
        {ocupado && (
          <View style={[styles.overlay, caixa]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.botoes}>
        <Pressable
          style={styles.btn}
          onPress={alterar}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel="Alterar foto de perfil"
        >
          <Text style={styles.btnTxt}>Alterar foto</Text>
        </Pressable>
        {foto && (
          <Pressable
            style={styles.btn}
            onPress={remover}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Remover foto de perfil"
          >
            <Text style={[styles.btnTxt, { color: 'rgba(255,255,255,0.75)' }]}>Remover foto</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  inicial: { color: '#fff', fontSize: 26, fontWeight: '800' },
  overlay: {
    position: 'absolute', backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  botoes: { flexDirection: 'row', gap: spacing.md },
  btn: { minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  btnTxt: { ...typography.small, color: colors.accent, fontWeight: '700' },
});
