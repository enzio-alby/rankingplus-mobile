import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { getDadosRelatorio, exportarRelatorioPdf } from '@/lib/relatorio';
import { colors, spacing, radius, typography } from '@/theme/tokens';

/**
 * Par de botões "Visualizar" + "Exportar PDF" do relatório (métricas + currículo).
 * - Visualizar: abre a prévia dentro do app (com bloqueio de print) — sempre.
 * - Exportar PDF: gera e compartilha o arquivo — só logado de verdade; na demo
 *   o botão aparece mas avisa que precisa de conta real.
 */
export function RelatorioAcoes({
  alunoId,
  nome,
  onAntesDeVisualizar,
}: {
  alunoId: number;
  nome: string;
  /** roda antes de navegar pra prévia — ex.: fechar um Modal que a cobriria */
  onAntesDeVisualizar?: () => void;
}) {
  const nav = useNavigation<any>();
  const { sessao } = useSession();
  const ehDemo = !!sessao?.demo;
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    if (ehDemo) {
      Alert.alert(
        'Somente com conta real',
        'A exportação do PDF fica disponível quando você entra com sua conta. No modo demonstração dá pra visualizar aqui dentro.',
      );
      return;
    }
    try {
      setExportando(true);
      const dados = await getDadosRelatorio(alunoId);
      await exportarRelatorioPdf(dados);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, styles.btnAlt]}
        onPress={() => {
          onAntesDeVisualizar?.();
          nav.navigate('RelatorioPreview', { alunoId, nome });
        }}
        accessibilityRole="button"
        accessibilityLabel="Visualizar prévia do relatório"
      >
        <Ionicons name="eye-outline" size={17} color={colors.primary} />
        <Text style={[styles.txt, styles.txtAlt]}>Visualizar</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, exportando && { opacity: 0.6 }]}
        disabled={exportando}
        onPress={exportar}
        accessibilityRole="button"
        accessibilityLabel={ehDemo ? 'Exportar PDF (indisponível na demonstração)' : 'Exportar PDF'}
      >
        {exportando ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={17} color="#fff" />
            <Text style={styles.txt}>Exportar PDF</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2,
  },
  btnAlt: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  txt: { ...typography.small, color: '#fff', fontWeight: '700' },
  txtAlt: { color: colors.primary },
});
