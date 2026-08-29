import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSession } from '@/auth/session';
import { verificarOtp, reenviarOtp } from '@/api/auth';
import { ApiError } from '@/api/client';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

/** Confirmação do código 2FA (mesmo fluxo do site). Ao validar, captura o
 *  `token` da sessão — o que faltava no app antigo. */
export function OtpScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { entrar } = useSession();
  const { tempToken, emailMascarado, tipo } = route.params;
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function confirmar() {
    if (codigo.trim().length !== 6) {
      setErro('O código tem 6 dígitos.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const r = await verificarOtp(tempToken, codigo.trim());
      await entrar({
        id: r.usuario.id,
        nome: r.usuario.nome,
        tipo,
        token: r.token,
      });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Código inválido.');
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar() {
    setErro(null);
    setMsg(null);
    try {
      const r = await reenviarOtp(tempToken);
      setMsg(r.mensagem || 'Novo código enviado.');
    } catch {
      setErro('Não foi possível reenviar.');
    }
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.h}>Código de verificação</Text>
      <Text style={styles.p}>
        Enviamos um código de 6 dígitos para {emailMascarado}.
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        value={codigo}
        onChangeText={setCodigo}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        textAlign="center"
        autoFocus
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {msg && <Text style={styles.msg}>{msg}</Text>}

      <Pressable
        style={[styles.btn, enviando && styles.btnBusy]}
        disabled={enviando}
        onPress={confirmar}
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnTxt}>Confirmar</Text>
        )}
      </Pressable>

      <Pressable style={styles.link} onPress={reenviar}>
        <Text style={styles.linkTxt}>Reenviar código</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.sm },
  h: { ...typography.h1, color: colors.text },
  p: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    fontSize: 28,
    letterSpacing: 8,
    color: colors.text,
  },
  erro: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  msg: { ...typography.small, color: colors.success, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnBusy: { opacity: 0.7 },
  btnTxt: { ...typography.h3, color: '#fff' },
  link: { paddingVertical: spacing.md, alignItems: 'center' },
  linkTxt: { ...typography.body, color: colors.accent },
});
