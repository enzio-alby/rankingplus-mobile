import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import {
  getDisciplinasProfessor,
  getAlunosDaDisciplina,
  getEvolucaoTurma,
  enviarAvisoTurma,
} from '@/api/professor';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { LinhaChart } from '@/components/chart';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const COR_MENCAO: Record<string, string> = {
  SS: colors.success, MS: '#65A30D', MM: colors.warning, MI: '#EA580C', II: colors.danger,
};

export function ProfTurmasScreen() {
  const { sessao } = useSession();
  const id = sessao?.id ?? 0;
  const discs = useQuery({ queryKey: ['prof-discs', id], queryFn: () => getDisciplinasProfessor(id) });
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <ScreenScroll onRefresh={discs.refetch} refreshing={discs.isRefetching}>
      <Titulo>Turmas</Titulo>
      <Estado
        carregando={discs.isLoading}
        erro={discs.isError ? 'Erro ao carregar turmas.' : null}
        vazio={discs.data?.length === 0}
        onRetry={discs.refetch}
      />
      {discs.data?.map((d) => (
        <Card key={d.id}>
          <Pressable
            style={styles.head}
            onPress={() => setAberta((a) => (a === d.id ? null : d.id))}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.materia}>{d.nome_materia}</Text>
              <Text style={styles.sub}>
                {[d.dia_semana, d.horario, d.sala].filter(Boolean).join(' · ') || 'sem horário'} · {d.total_alunos} alunos
              </Text>
            </View>
            <Text style={styles.chev}>{aberta === d.id ? '▲' : '▼'}</Text>
          </Pressable>
          {aberta === d.id && (
            <>
              <PainelTurma discId={d.id} nome={d.nome_materia} />
              <ListaAlunos profId={id} discId={d.id} />
            </>
          )}
        </Card>
      ))}
    </ScreenScroll>
  );
}

function PainelTurma({ discId, nome }: { discId: number; nome: string }) {
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [texto, setTexto] = useState('');

  const evo = useQuery({
    queryKey: ['turma-evolucao', discId],
    queryFn: () => getEvolucaoTurma(discId),
  });

  const aviso = useMutation({
    mutationFn: () => enviarAvisoTurma(discId, texto.trim()),
    onSuccess: (r) => {
      setTexto('');
      setAvisoAberto(false);
      Alert.alert('Aviso enviado', r?.mensagem ?? 'Os alunos da turma foram notificados.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível enviar o aviso.'),
  });

  return (
    <View style={styles.painel}>
      {evo.data && evo.data.values.length > 1 ? (
        <LinhaChart
          titulo="Média da turma por semestre"
          labels={evo.data.labels}
          values={evo.data.values}
        />
      ) : (
        <Text style={styles.painelVazio}>
          {evo.isLoading ? 'Carregando desempenho…' : 'Sem histórico de médias para esta turma ainda.'}
        </Text>
      )}

      {avisoAberto ? (
        <View style={styles.avisoBox}>
          <TextInput
            style={styles.avisoInput}
            value={texto}
            onChangeText={setTexto}
            placeholder={`Aviso para ${nome}…`}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={styles.avisoBtns}>
            <Pressable onPress={() => setAvisoAberto(false)} style={styles.avisoBtn}>
              <Text style={styles.avisoBtnTxt}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.avisoBtn, styles.avisoBtnPrim, (!texto.trim() || aviso.isPending) && { opacity: 0.5 }]}
              disabled={!texto.trim() || aviso.isPending}
              onPress={() => aviso.mutate()}
              accessibilityRole="button"
              accessibilityLabel="Enviar aviso à turma"
            >
              {aviso.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.avisoBtnTxt, { color: '#fff' }]}>Enviar</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.avisoAbrir}
          onPress={() => setAvisoAberto(true)}
          accessibilityRole="button"
          accessibilityLabel="Escrever aviso para a turma"
        >
          <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
          <Text style={styles.avisoAbrirTxt}>Enviar aviso à turma</Text>
        </Pressable>
      )}
    </View>
  );
}

function ListaAlunos({ profId, discId }: { profId: number; discId: number }) {
  const nav = useNavigation<any>();
  const q = useQuery({
    queryKey: ['turma-alunos', profId, discId],
    queryFn: () => getAlunosDaDisciplina(profId, discId),
  });
  return (
    <View style={styles.alunos}>
      <Estado carregando={q.isLoading} erro={q.isError ? 'Erro.' : null} vazio={q.data?.length === 0} onRetry={q.refetch} />
      {q.data?.map((a, i) => (
        <Pressable
          key={`${a.id}-${i}`}
          style={styles.aluno}
          onPress={() =>
            nav.navigate('EditarLancamento', {
              profId,
              discId,
              alunoId: a.id,
              nome: a.nome,
              atual: {
                mencao: a.mencao,
                faltas: a.faltas ?? null,
                nota_avaliacao: a.nota_avaliacao ?? null,
                atividades_entregues: a.atividades_entregues ?? null,
              },
            })
          }
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.alunoNome}>{a.nome}</Text>
            <Text style={styles.alunoSub}>{a.matricula ?? '—'} · {Math.round(a.frequencia)}% freq.</Text>
          </View>
          <Text style={styles.alunoFaltas}>{a.faltas ?? 0} faltas</Text>
          {a.mencao ? (
            <View style={[styles.badge, { backgroundColor: (COR_MENCAO[a.mencao] ?? colors.textMuted) + '22' }]}>
              <Text style={[styles.badgeTxt, { color: COR_MENCAO[a.mencao] ?? colors.textMuted }]}>{a.mencao}</Text>
            </View>
          ) : (
            <Text style={styles.semNota}>—</Text>
          )}
          <Text style={styles.editar}>✎</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  materia: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  chev: { color: colors.textMuted, fontSize: 12 },
  alunos: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm },
  aluno: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  alunoNome: { ...typography.body, color: colors.text, fontWeight: '600' },
  alunoSub: { ...typography.tiny, color: colors.textMuted },
  alunoFaltas: { ...typography.tiny, color: colors.textMuted },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeTxt: { ...typography.small, fontWeight: '800' },
  semNota: { color: colors.textMuted, width: 30, textAlign: 'center' },
  editar: { color: colors.textMuted, fontSize: 14, marginLeft: 4 },
  painel: {
    marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm, gap: spacing.sm,
  },
  painelVazio: { ...typography.small, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  avisoAbrir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  avisoAbrirTxt: { ...typography.small, color: colors.primary, fontWeight: '700' },
  avisoBox: { gap: spacing.sm },
  avisoInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text,
    minHeight: 64, textAlignVertical: 'top',
  },
  avisoBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  avisoBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  avisoBtnPrim: { backgroundColor: colors.primary },
  avisoBtnTxt: { ...typography.small, color: colors.textMuted, fontWeight: '700' },
});
