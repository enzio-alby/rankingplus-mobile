import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useGoogleLogin, type PerfilGoogle } from '@/auth/google';
import { colors, spacing, radius, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const irParaDemo = useCallback(
    (p: PerfilGoogle) =>
      navigation.navigate('DemoSelect', {
        nomeGoogle: p.nome || 'Usuario',
        emailGoogle: p.email,
      }),
    [navigation],
  );

  const google = useGoogleLogin(irParaDemo);

  function entrarComGoogle() {
    if (google.disponivel) {
      void google.entrar();
    } else {
      // Sem OAuth configurado / rodando no Expo Go → fluxo mock.
      irParaDemo({ nome: 'Usuario', email: '' });
    }
  }

  return (
    <LinearGradient
      colors={[colors.primary, '#1a1a3e']}
      style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.center}>
        <Text style={styles.logo}>
          RANKING<Text style={{ color: colors.accent }}>+</Text>
        </Text>
        <Text style={styles.tagline}>
          Seu desempenho acadêmico como ativo de carreira.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.googleBtn} onPress={entrarComGoogle} disabled={google.carregando}>
          {google.carregando ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.primary} />
              <Text style={styles.googleBtnText}>Entrar com Google</Text>
            </>
          )}
        </Pressable>

        {google.erro && <Text style={styles.erro}>{google.erro}</Text>}

        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('LoginEmail')}>
          <Text style={styles.linkBtnText}>Entrar como usuário</Text>
        </Pressable>

        <Pressable
          style={styles.termosBtn}
          onPress={() => navigation.navigate('Termos', { origem: 'inicial' })}
        >
          <Text style={styles.termosText}>Termos e privacidade</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logo: { fontSize: 44, fontWeight: '800', color: colors.textOnPrimary, letterSpacing: 1 },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 280,
  },
  actions: { padding: spacing.xl, gap: spacing.sm },
  googleBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: { ...typography.h3, color: colors.primary },
  erro: { ...typography.small, color: '#ffd0c8', textAlign: 'center' },
  linkBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  linkBtnText: { ...typography.body, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  termosBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  termosText: { ...typography.small, color: 'rgba(255,255,255,0.55)' },
});
