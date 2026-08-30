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

const DESTAQUES: { icon: keyof typeof Ionicons.glyphMap; texto: string }[] = [
  { icon: 'trophy', texto: 'Ranking acadêmico' },
  { icon: 'search', texto: 'Portal de talentos' },
  { icon: 'sparkles', texto: 'Perfil comportamental' },
];

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
    if (google.disponivel) void google.entrar();
    else irParaDemo({ nome: 'Usuario', email: '' });
  }

  return (
    <LinearGradient
      colors={['#05051f', colors.primary, '#241f52']}
      locations={[0, 0.55, 1]}
      style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* halos decorativos — puro shape, sem asset */}
      <View pointerEvents="none" style={[styles.halo, styles.haloAccent]} />
      <View pointerEvents="none" style={[styles.halo, styles.haloLight]} />

      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            RANKING<Text style={{ color: colors.accent }}>+</Text>
          </Text>
          <View style={styles.underline} />
        </View>
        <Text style={styles.tagline}>
          Seu desempenho acadêmico como ativo de carreira.
        </Text>

        <View style={styles.destaques}>
          {DESTAQUES.map((d) => (
            <View key={d.texto} style={styles.destaque}>
              <Ionicons name={d.icon} size={16} color={colors.accent} />
              <Text style={styles.destaqueTxt}>{d.texto}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.googleBtn} onPress={entrarComGoogle} disabled={google.carregando}>
          {google.carregando ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.primary} />
              <Text style={styles.googleBtnText}>Entrar com Google · Demonstração</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.hint}>Explore como aluno, professor ou empresa. Dados temporários.</Text>

        {google.erro && <Text style={styles.erro}>{google.erro}</Text>}

        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('LoginEmail')}>
          <Text style={styles.linkBtnText}>Entrar com minha conta</Text>
        </Pressable>

        <Pressable
          style={styles.sobreBtn}
          onPress={() => navigation.navigate('Sobre')}
          accessibilityRole="button"
          accessibilityLabel="Sobre a plataforma e o projeto"
        >
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.sobreText}>Sobre o projeto</Text>
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
  fill: { flex: 1, overflow: 'hidden' },
  halo: { position: 'absolute', borderRadius: 999 },
  haloAccent: {
    width: 340, height: 340, top: -120, right: -110,
    backgroundColor: colors.accent, opacity: 0.14,
  },
  haloLight: {
    width: 260, height: 260, bottom: 40, left: -120,
    backgroundColor: '#fff', opacity: 0.05,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center' },
  logo: { fontSize: 46, fontWeight: '800', color: colors.textOnPrimary, letterSpacing: 1.5 },
  underline: {
    width: 54, height: 4, borderRadius: 2, backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 290,
    lineHeight: 22,
  },
  destaques: { marginTop: spacing.xl, gap: spacing.sm },
  destaque: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  destaqueTxt: { ...typography.small, color: 'rgba(255,255,255,0.72)' },
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
  googleBtnText: { ...typography.body, color: colors.primary, fontWeight: '700' },
  hint: { ...typography.tiny, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: -4 },
  erro: { ...typography.small, color: '#ffd0c8', textAlign: 'center' },
  linkBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  linkBtnText: { ...typography.body, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  sobreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill,
  },
  sobreText: { ...typography.small, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  termosBtn: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  termosText: { ...typography.small, color: 'rgba(255,255,255,0.55)' },
});
