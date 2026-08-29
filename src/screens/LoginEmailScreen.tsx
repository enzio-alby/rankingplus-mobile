import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { Papel } from '@/types/api';
import { useSession } from '@/auth/session';
import { login, loginEmpresa } from '@/api/auth';
import { ApiError } from '@/api/client';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginEmail'>;

const PAPEIS: { valor: Papel; rotulo: string }[] = [
  { valor: 'aluno', rotulo: 'Aluno' },
  { valor: 'professor', rotulo: 'Professor' },
  { valor: 'empresa', rotulo: 'Empresa' },
];

/** Login real (mesmo fluxo do site): e-mail/matrícula + senha. Aluno e professor
 *  seguem pro OTP; empresa entra direto. */
export function LoginEmailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { entrar } = useSession();
  const [papel, setPapel] = useState<Papel>('aluno');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarAcao() {
    if (!identificador.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      if (papel === 'empresa') {
        const r = await loginEmpresa(identificador.trim(), senha);
        await entrar({
          id: r.empresa.id,
          nome: r.empresa.nome_fantasia || r.empresa.razao_social || 'Empresa',
          tipo: 'empresa',
          token: r.token,
        });
        return;
      }
      const r = await login(papel, identificador.trim(), senha);
      navigation.navigate('Otp', {
        tempToken: r.tempToken,
        emailMascarado: r.emailMascarado,
        tipo: papel,
      });
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.status === 0
            ? 'Sem conexão com o servidor. Confira o Wi-Fi / se o backend está no ar.'
            : e.message
          : 'Não foi possível entrar.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[colors.primary, '#1a1a3e']}
          style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
        >
          <Text style={styles.logo}>
            RANKING<Text style={{ color: colors.accent }}>+</Text>
          </Text>
          <Text style={styles.headerSub}>Entrar como usuário</Text>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.segment}>
            {PAPEIS.map((p) => (
              <Pressable
                key={p.valor}
                style={[styles.segBtn, papel === p.valor && styles.segBtnOn]}
                onPress={() => setPapel(p.valor)}
              >
                <Text style={[styles.segTxt, papel === p.valor && styles.segTxtOn]}>
                  {p.rotulo}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            {papel === 'aluno' ? 'E-mail ou matrícula' : 'E-mail'}
          </Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={identificador}
            onChangeText={setIdentificador}
            placeholder="voce@exemplo.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />

          {erro && <Text style={styles.erro}>{erro}</Text>}

          <Pressable
            style={[styles.btn, enviando && styles.btnBusy]}
            disabled={enviando}
            onPress={entrarAcao}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>
                {papel === 'empresa' ? 'Entrar' : 'Enviar código'}
              </Text>
            )}
          </Pressable>

          {papel !== 'empresa' && (
            <Text style={styles.nota}>
              Aluno e professor recebem um código de 6 dígitos por e-mail (2FA).
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: { fontSize: 30, fontWeight: '800', color: colors.textOnPrimary, letterSpacing: 1 },
  headerSub: { ...typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    margin: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bgMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  segBtnOn: { backgroundColor: colors.surface, elevation: 1 },
  segTxt: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  segTxtOn: { color: colors.primary },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  erro: { ...typography.small, color: colors.danger, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnBusy: { opacity: 0.7 },
  btnTxt: { ...typography.h3, color: '#fff' },
  nota: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
});
