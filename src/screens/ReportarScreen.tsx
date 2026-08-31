import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Constants from 'expo-constants';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSession } from '@/auth/session';
import { enviarReporte } from '@/api/suporte';
import { ScreenScroll, Titulo, Card } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReportarScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const headerHeight = useHeaderHeight();

  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');

  const papel = sessao?.tipo ?? 'visitante';
  const modo = sessao?.demo ? 'demonstração' : 'conta real';
  const versao = (Constants.expoConfig?.version ?? '?') as string;
  const contexto = `\n\n---\nApp ${versao} · ${Platform.OS} · perfil ${papel} · ${modo}`;

  const m = useMutation({
    mutationFn: () =>
      enviarReporte({
        nome: sessao?.nome ?? 'Testador do app',
        email,
        assunto: `Report do app — ${papel} (${versao})`,
        descricao: descricao + contexto,
      }),
    onSuccess: () => {
      Alert.alert('Enviado', 'Obrigado! Seu report foi registrado e a equipe foi avisada por e-mail.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    },
    onError: (e) =>
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar agora. Tente de novo.'),
  });

  function enviar() {
    if (!EMAIL_RX.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Informe um e-mail válido para a equipe poder responder.');
      return;
    }
    if (descricao.trim().length < 10) {
      Alert.alert('Conte um pouco mais', 'Descreva o que aconteceu com pelo menos uma frase.');
      return;
    }
    m.mutate();
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
    <ScreenScroll>
      <Titulo>Reportar um problema</Titulo>
      <Text style={styles.intro}>
        Achou um bug ou algo estranho? Conta pra gente — vai direto pro e-mail da equipe.
      </Text>

      <Card>
        <Text style={styles.label}>Seu e-mail (para retorno)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="voce@exemplo.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>O que aconteceu?</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva o erro, em que tela aconteceu e o que você esperava."
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={styles.ctx}>
          Enviado junto: versão {versao}, {Platform.OS}, perfil {papel} ({modo}).
        </Text>

        <Pressable
          style={[styles.btn, m.isPending && { opacity: 0.6 }]}
          disabled={m.isPending}
          onPress={enviar}
          accessibilityRole="button"
          accessibilityLabel="Enviar report"
        >
          {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Enviar</Text>}
        </Pressable>
      </Card>
    </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  intro: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  ctx: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  btnTxt: { ...typography.h3, color: '#fff' },
});
