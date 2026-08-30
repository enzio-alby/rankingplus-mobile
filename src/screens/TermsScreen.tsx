import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '@/theme/tokens';

/**
 * Termos de Uso + Política de Privacidade — versão mobile.
 * Cobre os mesmos temas do `html/termodeuso.html` do web (aceitação, ranking,
 * perfil comportamental, dados/LGPD, cookies, direitos, conduta, contato) em
 * seções recolhíveis. Os termos completos ficam na plataforma web.
 */
export function TermsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.h}>Termos de Uso e Privacidade</Text>
      <Text style={styles.p}>
        Ao usar o Ranking+ você concorda com estes termos. Projeto acadêmico
        (Projeto Integrador IV — UniCEUB). O tratamento de dados pessoais segue a
        LGPD (Lei 13.709/2018).
      </Text>

      <View style={styles.destaque}>
        <Text style={styles.destaqueTit}>Modo demonstração</Text>
        <Text style={styles.destaqueTxt}>
          Ao entrar com Google e escolher um perfil de demonstração, o app usa um
          perfil de referência com dados fictícios ou de demonstração. As
          alterações que você fizer ficam só neste aparelho e são apagadas ao
          sair ou fechar o app. Nada é enviado a recrutadores, empresas ou
          terceiros reais.
        </Text>
      </View>

      <Secao titulo="1. Aceitação e elegibilidade">
        Você declara ter capacidade legal para aceitar estes termos. Contas de
        aluno e professor são vinculadas à instituição; contas de empresa
        representam pessoas jurídicas. Informações de cadastro devem ser
        verdadeiras e mantidas atualizadas.
      </Secao>

      <Secao titulo="2. Sistema de Ranking">
        O ranking ordena alunos por desempenho acadêmico (menções e frequência).
        A exibição do seu nome no ranking público é opcional: com o opt-out
        desligado, você aparece como “Aluno Anônimo”. O ranking não substitui
        avaliação oficial da instituição.
      </Secao>

      <Secao titulo="3. Mapeamento de Perfil Comportamental">
        É um questionário de autopercepção (base Big Five) traduzido em perfis de
        estilo de trabalho. NÃO é teste psicológico nem laudo (Res. CFP; sem
        registro no SATEPSI) e não deve ser usado como tal. Nenhuma decisão sobre
        você é automatizada sem revisão humana (LGPD, Art. 20); você pode pedir
        revisão e refazer o mapeamento.
      </Secao>

      <Secao titulo="4. Dados que coletamos">
        Cadastro (nome, e-mail, curso/semestre, matrícula ou CNPJ). Dados
        acadêmicos (menções, faltas, atividades) fornecidos pela instituição.
        Perfil profissional que você preenche (resumo, experiências, links
        GitHub/LinkedIn). Respostas do mapeamento comportamental. Registros de
        uso essenciais (login, sessão). O app não usa rastreamento publicitário.
      </Secao>

      <Secao titulo="5. Uso e compartilhamento">
        Os dados são usados para operar o ranking, o portal de talentos e as
        funcionalidades que você ativa. Seu perfil só fica visível para empresas
        se você optar por aparecer no ranking/portal. Não vendemos dados pessoais.
        Compartilhamento apenas com provedores estritamente necessários
        (e-mail/OTP) e quando exigido por lei.
      </Secao>

      <Secao titulo="6. Segurança e retenção">
        Senhas com hash (bcrypt); mensagens e anexos do chat cifrados em repouso
        (AES). No app, a sessão fica no armazenamento seguro do aparelho
        (Keystore/Keychain). Dados são retidos enquanto a conta existir; após
        encerramento, são eliminados ou anonimizados, salvo obrigação legal.
      </Secao>

      <Secao titulo="7. Cookies e telemetria">
        A versão web usa cookies essenciais de sessão. O app mobile guarda apenas
        o necessário para manter você logado e preferências locais — sem cookies
        de terceiros e sem analytics de comportamento.
      </Secao>

      <Secao titulo="8. Seus direitos (LGPD)">
        {'Você pode solicitar, a qualquer momento:\n' +
          '• acesso e confirmação de tratamento\n' +
          '• correção de dados incompletos ou desatualizados\n' +
          '• exclusão / anonimização\n' +
          '• portabilidade dos seus dados\n' +
          '• revogação do consentimento\n' +
          '• revisão de decisões automatizadas\n' +
          '• petição à ANPD (gov.br/anpd)'}
      </Secao>

      <Secao titulo="9. Conduta do usuário">
        É proibido falsear identidade ou dados, tentar acessar contas de
        terceiros, automatizar acessos indevidos, ou usar a plataforma para
        assédio, discriminação ou spam. O descumprimento pode levar à suspensão
        ou encerramento da conta.
      </Secao>

      <Secao titulo="10. Contato">
        {'Encarregado de dados / suporte: admin.rankingplus@gmail.com\n' +
          'Solicitações de titular são respondidas no prazo da LGPD.'}
      </Secao>

      <Text style={styles.rodape}>
        Versão mobile resumida. Os Termos de Uso e a Política de Privacidade
        completos estão na plataforma web do Ranking+.
      </Text>

      <Pressable style={styles.btn} onPress={() => nav.goBack()}>
        <Text style={styles.btnTxt}>Li e entendi</Text>
      </Pressable>
    </ScrollView>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [aberta, setAberta] = useState(false);
  return (
    <View style={styles.secao}>
      <Pressable style={styles.secaoHead} onPress={() => setAberta((v) => !v)}>
        <Text style={styles.secaoTit}>{titulo}</Text>
        <Text style={styles.secaoChev}>{aberta ? '−' : '+'}</Text>
      </Pressable>
      {aberta && <Text style={styles.secaoTxt}>{children}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  h: { ...typography.h1, color: colors.text },
  p: { ...typography.body, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.sm },
  destaque: {
    backgroundColor: colors.bgMuted,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  destaqueTit: { ...typography.h3, color: colors.text, marginBottom: 4 },
  destaqueTxt: { ...typography.small, color: colors.textMuted, lineHeight: 19 },
  secao: { borderBottomWidth: 1, borderBottomColor: colors.border },
  secaoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  secaoTit: { ...typography.h3, color: colors.text, flex: 1 },
  secaoChev: { ...typography.h2, color: colors.textMuted, width: 24, textAlign: 'center' },
  secaoTxt: { ...typography.small, color: colors.textMuted, lineHeight: 20, paddingBottom: spacing.md },
  rodape: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 16 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnTxt: { ...typography.h3, color: '#fff' },
});
