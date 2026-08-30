import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import {
  getQuestionarioAtivo,
  getAvaliacaoComportamental,
  enviarAvaliacaoComportamental,
} from '@/api/comportamental';
import type { ResultadoComportamental } from '@/api_mobile';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const POR_PAGINA = 8;

const ROTULO_PERFIL: Record<string, string> = {
  executor: 'Executor',
  comunicador: 'Comunicador',
  planejador: 'Planejador',
  analista: 'Analista',
};
const ROTULO_EIXO: Record<string, string> = {
  execucao: 'Execução',
  comunicacao: 'Comunicação',
  colaboracao: 'Colaboração',
  resiliencia: 'Resiliência',
  aprendizado: 'Aprendizado',
};

function quando(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function PerfilComportamentalScreen() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const id = sessao?.id ?? 0;
  const ehDemo = !!sessao?.demo;

  const atual = useQuery({
    queryKey: ['avaliacao-comp', id],
    queryFn: () => getAvaliacaoComportamental(id),
  });

  const [modo, setModo] = useState<'intro' | 'form' | 'resultado'>('intro');
  const [pagina, setPagina] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number[]>>({});
  const [resultado, setResultado] = useState<ResultadoComportamental['perfis'] | null>(null);
  const [eixos, setEixos] = useState<ResultadoComportamental['eixos'] | null>(null);
  const [dominante, setDominante] = useState<string>('');

  const quest = useQuery({
    queryKey: ['questionario-comp'],
    queryFn: getQuestionarioAtivo,
    enabled: modo === 'form',
  });

  const perguntas = quest.data?.perguntas ?? [];
  const totalPag = Math.ceil(perguntas.length / POR_PAGINA);
  const daPagina = perguntas.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);
  const respondidas = useMemo(
    () => perguntas.filter((p) => (respostas[p.id] ?? []).length > 0).length,
    [perguntas, respostas],
  );
  const tudoRespondido = perguntas.length > 0 && respondidas === perguntas.length;

  const enviar = useMutation({
    mutationFn: () => {
      const flat = Object.entries(respostas).flatMap(([pid, ops]) =>
        ops.map((opcao_id) => ({ pergunta_id: Number(pid), opcao_id })),
      );
      return enviarAvaliacaoComportamental(id, flat);
    },
    onSuccess: (r) => {
      setResultado({ ...r.perfis });
      setEixos(r.eixos);
      setDominante(r.perfil_dominante);
      atual.refetch();
      setModo('resultado');
    },
    onError: (e) =>
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar as respostas.'),
  });

  function selecionar(perguntaId: number, bloco: string, opcaoId: number) {
    setRespostas((r) => {
      const atuais = r[perguntaId] ?? [];
      if (bloco === 'pretensao') {
        if (atuais.includes(opcaoId)) return { ...r, [perguntaId]: atuais.filter((x) => x !== opcaoId) };
        if (atuais.length >= 2) return r;
        return { ...r, [perguntaId]: [...atuais, opcaoId] };
      }
      return { ...r, [perguntaId]: [opcaoId] };
    });
  }

  // ─── Resultado ───────────────────────────────────────────────────────────
  const res = resultado;
  const resEixos = eixos;
  const resDom = dominante;

  if (modo === 'resultado' && res && resEixos) {
    return (
      <ScreenScroll>
        <View style={styles.okTopo}>
          <Ionicons name="checkmark-circle" size={40} color={colors.success} />
          <Text style={styles.okTit}>Perfil calculado</Text>
          <Text style={styles.okSub}>Válido até {quando(atual.data?.avaliacao?.valido_ate ?? null)}</Text>
        </View>
        <Card>
          <Text style={styles.secTit}>Perfil dominante</Text>
          <Text style={styles.dominante}>{ROTULO_PERFIL[resDom] ?? resDom}</Text>
        </Card>
        <Card>
          <Text style={styles.secTit}>Os 4 perfis</Text>
          {(['executor', 'comunicador', 'planejador', 'analista'] as const).map((k) => (
            <Barra key={k} rotulo={ROTULO_PERFIL[k]} valor={res[k]} destaque={k === resDom} />
          ))}
        </Card>
        <Card>
          <Text style={styles.secTit}>Eixos comportamentais</Text>
          {(Object.keys(ROTULO_EIXO) as (keyof typeof ROTULO_EIXO)[]).map((k) => (
            <Barra key={k} rotulo={ROTULO_EIXO[k]} valor={resEixos[k as keyof typeof resEixos]} />
          ))}
        </Card>
        <Pressable style={styles.btn} onPress={() => nav.goBack()} accessibilityRole="button">
          <Text style={styles.btnTxt}>Voltar ao perfil</Text>
        </Pressable>
      </ScreenScroll>
    );
  }

  // ─── Formulário ──────────────────────────────────────────────────────────
  if (modo === 'form') {
    return (
      <ScreenScroll>
        <View style={styles.progresso}>
          <View style={styles.trilho}>
            <View
              style={[
                styles.trilhoFill,
                { width: `${perguntas.length ? (respondidas / perguntas.length) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressoTxt}>
            {respondidas} / {perguntas.length || 50} respondidas
          </Text>
        </View>

        <Estado
          carregando={quest.isLoading}
          erro={quest.isError ? 'Não foi possível carregar o questionário.' : null}
          onRetry={quest.refetch}
        />

        {daPagina.map((p) => {
          const sel = respostas[p.id] ?? [];
          const multi = p.bloco === 'pretensao';
          return (
            <Card key={p.id}>
              <Text style={styles.enunciado}>
                {p.ordem}. {p.enunciado}
              </Text>
              {multi && <Text style={styles.dica}>Marque até 2 opções.</Text>}
              {p.opcoes.map((o) => {
                const on = sel.includes(o.id);
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.opcao, on && styles.opcaoOn]}
                    onPress={() => selecionar(p.id, p.bloco, o.id)}
                    accessibilityRole={multi ? 'checkbox' : 'radio'}
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={o.texto}
                  >
                    <Ionicons
                      name={
                        multi
                          ? on
                            ? 'checkbox'
                            : 'square-outline'
                          : on
                            ? 'radio-button-on'
                            : 'radio-button-off'
                      }
                      size={18}
                      color={on ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.opcaoTxt, on && styles.opcaoTxtOn]}>{o.texto}</Text>
                  </Pressable>
                );
              })}
            </Card>
          );
        })}

        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, pagina === 0 && { opacity: 0.4 }]}
            disabled={pagina === 0}
            onPress={() => setPagina((n) => Math.max(0, n - 1))}
            accessibilityRole="button"
            accessibilityLabel="Página anterior"
          >
            <Text style={styles.navTxt}>Voltar</Text>
          </Pressable>

          {pagina < totalPag - 1 ? (
            <Pressable
              style={[styles.navBtn, styles.navPrim]}
              onPress={() => setPagina((n) => Math.min(totalPag - 1, n + 1))}
              accessibilityRole="button"
              accessibilityLabel="Próxima página"
            >
              <Text style={[styles.navTxt, { color: '#fff' }]}>Próxima</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.navBtn, styles.navPrim, (!tudoRespondido || enviar.isPending) && { opacity: 0.5 }]}
              disabled={!tudoRespondido || enviar.isPending}
              onPress={() => enviar.mutate()}
              accessibilityRole="button"
              accessibilityLabel="Enviar e calcular meu perfil"
            >
              {enviar.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.navTxt, { color: '#fff' }]}>Enviar e calcular</Text>
              )}
            </Pressable>
          )}
        </View>
        {!tudoRespondido && pagina === totalPag - 1 && (
          <Text style={styles.aviso}>Responda todas as perguntas para enviar.</Text>
        )}
      </ScreenScroll>
    );
  }

  // ─── Introdução / aviso ──────────────────────────────────────────────────
  const temAtual = !!atual.data?.avaliacao;
  const podeReavaliar = atual.data?.pode_reavaliar_agora ?? true;
  const proxima = atual.data?.proxima_liberacao ?? null;

  const btnBloqueado = ehDemo || (temAtual && !podeReavaliar);
  const notaBloqueio = ehDemo
    ? 'Responder a avaliação só com sua conta real. No modo demonstração dá pra ler esta explicação.'
    : temAtual && !podeReavaliar
      ? `Você já respondeu. Poderá refazer a partir de ${quando(proxima)}.`
      : '';

  return (
    <ScreenScroll onRefresh={atual.refetch} refreshing={atual.isRefetching}>
      <Titulo>Mapeamento de Perfil Comportamental</Titulo>

      <Card>
        <Text style={styles.paragrafo}>
          50 perguntas rápidas, só de marcar — leva cerca de 10–12 minutos. O resultado fica
          visível para empresas parceiras no Portal de Talentos.
        </Text>
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.disclaimerTxt}>
            Não é um teste psicológico nem laudo clínico — é uma ferramenta de autoconhecimento e
            adequação a vagas. Seus dados são tratados conforme a LGPD; a apresentação segue as
            orientações do CFP/SATEPSI para instrumentos não-psicológicos.
          </Text>
        </View>
        <View style={styles.lista}>
          <Item texto="Nenhuma resposta certa ou errada" />
          <Item texto="Resultado calculado na hora, assim que você enviar" />
          <Item texto="Válido por 6 meses — depois disso, você pode refazer" />
        </View>
        <Text style={styles.comoTit}>Como preencher</Text>
        <Text style={styles.como}>
          Na maioria das perguntas você marca o quanto concorda com uma frase. Em outras, escolhe a
          que mais parece com você. Nas duas últimas (sobre a vaga que procura) dá pra marcar até 2.
          Responda pensando em como você realmente costuma agir.
        </Text>
      </Card>

      <Estado carregando={atual.isLoading} />

      {temAtual && (
        <Card style={styles.atualCard}>
          <Text style={styles.secTit}>Seu perfil atual</Text>
          <Text style={styles.dominante}>
            {ROTULO_PERFIL[atual.data!.avaliacao!.perfil_dominante] ??
              atual.data!.avaliacao!.perfil_dominante}
          </Text>
          <Text style={styles.okSub}>
            respondido em {quando(atual.data!.avaliacao!.respondido_em)} · válido até{' '}
            {quando(atual.data!.avaliacao!.valido_ate)}
          </Text>
        </Card>
      )}

      <Pressable
        style={[styles.btn, btnBloqueado && styles.btnOff]}
        disabled={btnBloqueado}
        onPress={() => {
          setModo('form');
          setPagina(0);
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: btnBloqueado }}
        accessibilityLabel={temAtual ? 'Refazer avaliação' : 'Iniciar avaliação'}
      >
        <Text style={[styles.btnTxt, btnBloqueado && styles.btnTxtOff]}>
          {btnBloqueado && <Ionicons name="lock-closed" size={14} color={colors.textMuted} />}{' '}
          {temAtual ? 'Refazer avaliação' : 'Iniciar'}
        </Text>
      </Pressable>
      {!!notaBloqueio && <Text style={styles.notaBloqueio}>{notaBloqueio}</Text>}
    </ScreenScroll>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <View style={styles.itemRow}>
      <Ionicons name="checkmark-circle" size={15} color={colors.success} />
      <Text style={styles.itemTxt}>{texto}</Text>
    </View>
  );
}

function Barra({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <View style={styles.barraWrap}>
      <View style={styles.barraTopo}>
        <Text style={[styles.barraRot, destaque && { color: colors.primary, fontWeight: '800' }]}>
          {rotulo}
        </Text>
        <Text style={styles.barraVal}>{Math.round(valor)}%</Text>
      </View>
      <View style={styles.trilho}>
        <View
          style={[
            styles.trilhoFill,
            { width: `${Math.max(0, Math.min(100, valor))}%` },
            destaque ? { backgroundColor: colors.primary } : { backgroundColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paragrafo: { ...typography.body, color: colors.text },
  disclaimer: {
    flexDirection: 'row', gap: 6, marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm,
  },
  disclaimerTxt: { ...typography.tiny, color: colors.textMuted, flex: 1, lineHeight: 16 },
  lista: { marginTop: spacing.sm, gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTxt: { ...typography.small, color: colors.text },
  comoTit: { ...typography.small, color: colors.text, fontWeight: '800', marginTop: spacing.md },
  como: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  atualCard: { borderColor: colors.primary + '55' },
  secTit: { ...typography.small, color: colors.textMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dominante: { ...typography.h1, color: colors.primary, marginTop: 2 },
  okSub: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  btnOff: { backgroundColor: colors.bgMuted },
  btnTxt: { ...typography.h3, color: '#fff' },
  btnTxtOff: { color: colors.textMuted },
  notaBloqueio: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  // form
  progresso: { marginBottom: spacing.sm },
  progressoTxt: { ...typography.tiny, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  enunciado: { ...typography.body, color: colors.text, fontWeight: '600' },
  dica: { ...typography.tiny, color: colors.accent, marginTop: 2 },
  opcao: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, marginTop: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  opcaoOn: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  opcaoTxt: { ...typography.small, color: colors.text, flex: 1 },
  opcaoTxtOn: { color: colors.text, fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  navBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  navPrim: { backgroundColor: colors.primary, borderColor: colors.primary },
  navTxt: { ...typography.body, color: colors.text, fontWeight: '700' },
  aviso: { ...typography.tiny, color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
  // resultado
  okTopo: { alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  okTit: { ...typography.h2, color: colors.text },
  barraWrap: { marginTop: spacing.sm },
  barraTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barraRot: { ...typography.small, color: colors.text },
  barraVal: { ...typography.tiny, color: colors.textMuted },
  trilho: { height: 8, borderRadius: 4, backgroundColor: colors.bgMuted, overflow: 'hidden' },
  trilhoFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
