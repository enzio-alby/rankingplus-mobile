import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { Papel } from '@/types/api';
import { useSession } from '@/auth/session';
import { iniciarDemoLocal } from '@/db/bootstrap';
import { colors, spacing, radius, typography } from '@/theme/tokens';
import { DEMO_TTL_HORAS } from '@/config';

type Props = NativeStackScreenProps<RootStackParamList, 'DemoSelect'>;

const OPCOES: {
  modo: Papel;
  titulo: string;
  base: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { modo: 'aluno', titulo: 'Aluno', base: 'um aluno real', desc: 'Boletim, ranking, perfil comportamental e vagas.', icon: 'school' },
  { modo: 'professor', titulo: 'Professor', base: 'um professor real', desc: 'Turmas, alunos e lançamento de menções e faltas.', icon: 'clipboard' },
  { modo: 'empresa', titulo: 'Empresa', base: 'uma empresa real', desc: 'Portal de Talentos, favoritos, vagas e contratações.', icon: 'business' },
];

export function DemoSelectScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { entrar } = useSession();
  const { nomeGoogle } = route.params;
  const [carregando, setCarregando] = useState<Papel | null>(null);

  async function escolher(modo: Papel) {
    if (carregando) return;
    setCarregando(modo);
    try {
      const sessao = await iniciarDemoLocal(modo, nomeGoogle);
      await entrar(sessao);
    } finally {
      setCarregando(null);
    }
  }

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[colors.primary, '#1a1a3e']}
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.chip}>
          <Ionicons name="flask" size={13} color={colors.accent} />
          <Text style={styles.chipText}>MODO DEMONSTRAÇÃO</Text>
        </View>
        <Text style={styles.oi}>Olá, {nomeGoogle}</Text>
        <Text style={styles.sub}>
          Escolha um papel pra explorar. Suas alterações são temporárias e
          apagadas ao sair (ou em até {DEMO_TTL_HORAS}h).
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.lista}>
        {OPCOES.map((o) => {
          const busy = carregando === o.modo;
          return (
            <Pressable
              key={o.modo}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                busy && styles.cardBusy,
              ]}
              disabled={carregando !== null}
              onPress={() => escolher(o.modo)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={o.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{o.titulo}</Text>
                <Text style={styles.cardNome}>
                  {nomeGoogle}_{o.modo}demo
                </Text>
                <Text style={styles.cardDesc}>{o.desc}</Text>
                <Text style={styles.cardBase}>baseado em {o.base}</Text>
              </View>
              {busy ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  chipText: { ...typography.tiny, color: '#fff', letterSpacing: 1, fontWeight: '700' },
  oi: { ...typography.h1, color: colors.textOnPrimary },
  sub: {
    ...typography.small,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  lista: { padding: spacing.lg, gap: spacing.md, marginTop: -spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardBusy: { opacity: 0.6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: { ...typography.h3, color: colors.text },
  cardNome: { ...typography.tiny, color: colors.accent, marginTop: 1, fontWeight: '600' },
  cardDesc: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  cardBase: { ...typography.tiny, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
});
