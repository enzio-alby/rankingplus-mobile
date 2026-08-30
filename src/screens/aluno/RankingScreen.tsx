import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { getRanking, getFiltros } from '@/api/aluno';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { FiltroBar, SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const MEDALHA = ['🥇', '🥈', '🥉'];
const PAGINA = 20;

export function RankingScreen() {
  const { sessao } = useSession();
  const meuId = sessao?.id ?? 0;

  const [curso, setCurso] = useState<string | null>(null);
  const [semestre, setSemestre] = useState<string | null>(null);
  const [disc, setDisc] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const filtros = useQuery({ queryKey: ['filtros'], queryFn: getFiltros });
  const q = useQuery({
    queryKey: ['ranking', curso, semestre, disc],
    queryFn: () => getRanking({ curso, semestre, disciplinaId: disc }),
  });

  const temFiltro = !!(curso || semestre || disc);
  function trocarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  const total = q.data?.length ?? 0;
  const visiveis = Math.min(pagina * PAGINA, total);
  const restantes = total - visiveis;

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Ranking</Titulo>

      <FiltroBar>
        <SelectPill
          label="Curso"
          value={curso}
          onChange={(v) => trocarFiltro(() => setCurso(v))}
          options={[
            { label: 'Todos os cursos', value: null },
            ...(filtros.data?.cursos ?? []).map((c) => ({ label: c, value: c })),
          ]}
        />
        <SelectPill
          label="Semestre"
          value={semestre}
          onChange={(v) => trocarFiltro(() => setSemestre(v))}
          options={[
            { label: 'Todos', value: null },
            ...(filtros.data?.semestres ?? []).map((s) => ({ label: `${s}º sem.`, value: String(s) })),
          ]}
        />
        <SelectPill
          label="Disciplina"
          value={disc}
          onChange={(v) => trocarFiltro(() => setDisc(v))}
          options={[
            { label: 'Todas', value: null },
            ...(filtros.data?.disciplinas ?? []).map((d) => ({ label: d.nome_materia, value: String(d.id) })),
          ]}
        />
        {temFiltro && (
          <Pressable
            style={styles.limpar}
            onPress={() =>
              trocarFiltro(() => {
                setCurso(null);
                setSemestre(null);
                setDisc(null);
              })
            }
          >
            <Text style={styles.limparTxt}>Limpar</Text>
          </Pressable>
        )}
      </FiltroBar>

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar o ranking.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Ninguém com esse filtro."
        onRetry={q.refetch}
      />
      {q.data?.slice(0, visiveis).map((a, i) => {
        const eu = a.id === meuId;
        return (
          <Card key={a.id} style={eu ? styles.eu : undefined}>
            <View style={styles.linha}>
              <Text style={styles.pos}>{MEDALHA[i] ?? `${i + 1}º`}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nome, eu && { color: colors.primary }]} numberOfLines={1}>
                  {a.nome}
                  {eu ? '  (você)' : ''}
                </Text>
                <Text style={styles.sub}>
                  {[a.curso, a.semestre_atual ? `${a.semestre_atual}º sem.` : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.dir}>
                <Text style={styles.pts}>{Number(a.pontuacao).toFixed(2)}</Text>
                <Text style={styles.freq}>{a.frequencia}% freq.</Text>
              </View>
            </View>
          </Card>
        );
      })}

      {total > PAGINA && (
        <View style={styles.paginacao}>
          <Text style={styles.contador}>
            {visiveis} de {total}
          </Text>
          <View style={styles.pagBtns}>
            {restantes > 0 && (
              <Pressable style={styles.pagBtn} onPress={() => setPagina((p) => p + 1)}>
                <Text style={styles.pagBtnTxt}>
                  Mostrar mais {restantes > PAGINA ? PAGINA : restantes}
                </Text>
              </Pressable>
            )}
            {pagina > 1 && (
              <Pressable
                style={[styles.pagBtn, styles.pagBtnAlt]}
                onPress={() => setPagina(1)}
              >
                <Text style={[styles.pagBtnTxt, styles.pagBtnTxtAlt]}>Recolher</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  eu: { borderWidth: 2, borderColor: colors.accent },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pos: { ...typography.h3, width: 40, textAlign: 'center', color: colors.textMuted },
  nome: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 1 },
  dir: { alignItems: 'flex-end' },
  pts: { ...typography.h3, color: colors.primary },
  freq: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
  limpar: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  limparTxt: { ...typography.small, color: colors.danger, fontWeight: '600' },
  paginacao: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  contador: { ...typography.tiny, color: colors.textMuted },
  pagBtns: { flexDirection: 'row', gap: spacing.sm },
  pagBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  pagBtnAlt: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  pagBtnTxt: { ...typography.small, color: '#fff', fontWeight: '700' },
  pagBtnTxtAlt: { color: colors.textMuted },
});
