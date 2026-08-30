import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const EQUIPE = [
  { ra: '22303511', nome: 'Enzio Albefaro da Silva' },
  { ra: '22308073', nome: 'Kaio Victor Silva Soares' },
  { ra: '22305512', nome: 'Sergio Gabriel de Lima Linard' },
  { ra: '22303954', nome: 'João Victor Monteiro Silva' },
];

export function SobreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={[colors.primary, '#241f52']}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <Text style={styles.logo}>
          RANKING<Text style={{ color: colors.accent }}>+</Text>
        </Text>
        <Text style={styles.headerSub}>Sobre a plataforma e o projeto</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <Secao icone="school-outline" titulo="A plataforma">
          <Text style={styles.p}>
            O Ranking+ transforma o histórico acadêmico verificado do aluno em um ativo de carreira.
            Reúne num só lugar o ranking acadêmico, um portal de talentos onde empresas encontram
            candidatos pelo desempenho real, o mapeamento de perfil comportamental e o chat entre
            alunos, professores e empresas.
          </Text>
        </Secao>

        <Secao icone="briefcase-outline" titulo="O projeto">
          <Text style={styles.p}>
            Trabalho acadêmico da disciplina de <Text style={styles.b}>Projeto Integrador IV</Text>,
            do 8º semestre do curso de <Text style={styles.b}>Ciência da Computação</Text> do
            UniCEUB — Centro Universitário de Brasília.
          </Text>
          <Text style={styles.p}>
            Este aplicativo é a versão mobile (React Native + Expo) da plataforma web, construída
            para a entrega do semestre. O conteúdo aqui exibido é de demonstração acadêmica.
          </Text>
        </Secao>

        <Secao icone="people-outline" titulo="A equipe">
          {EQUIPE.map((m) => (
            <View key={m.ra} style={styles.membro}>
              <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.membroNome}>{m.nome}</Text>
                <Text style={styles.membroRa}>RA {m.ra}</Text>
              </View>
            </View>
          ))}
        </Secao>

        <Text style={styles.rodape}>
          UniCEUB · Ciência da Computação · Projeto Integrador IV · 2026
        </Text>
      </ScrollView>
    </View>
  );
}

function Secao({
  icone,
  titulo,
  children,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name={icone} size={18} color={colors.primary} />
        <Text style={styles.cardTit}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bgMuted },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  headerSub: { ...typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  body: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.xs,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  cardTit: { ...typography.h3, color: colors.text },
  p: { ...typography.small, color: colors.text, lineHeight: 20 },
  b: { fontWeight: '700', color: colors.text },
  membro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  membroNome: { ...typography.body, color: colors.text, fontWeight: '600' },
  membroRa: { ...typography.tiny, color: colors.textMuted },
  rodape: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
});
