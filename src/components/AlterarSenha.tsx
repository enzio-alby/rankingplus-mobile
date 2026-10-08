import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = {
  /** Envia a nova senha; deve lançar Error com mensagem amigável em caso de falha. */
  onSalvar: (novaSenha: string) => Promise<void>;
};

/** Seção "Alterar senha": nova senha + confirmação, validação local (>= 6 e iguais). */
export function AlterarSenha({ onSalvar }: Props) {
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function salvar() {
    if (nova.length < 6) {
      setMsg({ ok: false, texto: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (nova !== confirmar) {
      setMsg({ ok: false, texto: 'As senhas não conferem.' });
      return;
    }
    setMsg(null);
    setEnviando(true);
    try {
      await onSalvar(nova);
      setNova('');
      setConfirmar('');
      setMsg({ ok: true, texto: 'Senha alterada com sucesso.' });
    } catch (e) {
      setMsg({ ok: false, texto: e instanceof Error ? e.message : 'Não foi possível alterar a senha.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Alterar senha</Text>
      <Text style={styles.label}>Nova senha</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        value={nova}
        onChangeText={setNova}
        placeholder="Mínimo de 6 caracteres"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Confirmar nova senha</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        value={confirmar}
        onChangeText={setConfirmar}
        placeholderTextColor={colors.textMuted}
      />
      {msg && <Text style={[styles.msg, { color: msg.ok ? colors.success : colors.danger }]}>{msg.texto}</Text>}
      <Pressable
        style={[styles.btn, enviando && { opacity: 0.6 }]}
        disabled={enviando}
        onPress={salvar}
        accessibilityRole="button"
        accessibilityLabel="Alterar senha"
        accessibilityState={{ disabled: enviando, busy: enviando }}
      >
        {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Alterar senha</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm,
  },
  titulo: { ...typography.h3, color: colors.text },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, minHeight: 44,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text,
  },
  msg: { ...typography.small, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md, minHeight: 44,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  btnTxt: { ...typography.h3, color: '#fff' },
});
