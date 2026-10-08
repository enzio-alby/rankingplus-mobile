import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Modal, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import {
  getFavoritos, mudarStatusFavorito, desfavoritar,
  salvarNotasFavorito, salvarEntrevistaFavorito,
} from '@/api/empresa';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { STATUS_FAVORITO, type StatusFavorito, type Favorito } from '@/api_mobile';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const ROTULO: Record<StatusFavorito, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  entrevista_marcada: 'Entrevista',
  contratado: 'Contratado',
  descartado: 'Descartado',
};
const COR: Record<StatusFavorito, string> = {
  novo: colors.textMuted,
  contatado: '#2563EB',
  entrevista_marcada: colors.warning,
  contratado: colors.success,
  descartado: colors.danger,
};

const LIMITE = 2000;

/** "2026-10-10 14:30:00" (ou ISO) -> "10/10/2026 14:30". */
function paraCampoData(v?: string | null): string {
  const m = v?.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : '';
}

/** "DD/MM/AAAA HH:MM" -> "YYYY-MM-DD HH:MM:00", ou null se inválida. */
function paraFormatoServidor(txt: string): string | null {
  const m = txt.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!m) return null;
  const [d, mes, a, h, mi] = [+m[1], +m[2], +m[3], +m[4], +m[5]];
  const dt = new Date(a, mes - 1, d, h, mi);
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d || h > 23 || mi > 59) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}:00`;
}

/** Modal "Notas e entrevista". As notas são privadas da empresa (o aluno nunca vê). */
function NotasEntrevistaModal({
  f, empId, onFechar, onSalvou,
}: { f: Favorito; empId: number; onFechar: () => void; onSalvou: () => void }) {
  const [notas, setNotas] = useState(f.notas ?? '');
  const [dataTxt, setDataTxt] = useState(paraCampoData(f.entrevista_data_hora));
  const [obs, setObs] = useState(f.entrevista_observacao ?? '');
  const [erroData, setErroData] = useState<string | null>(null);

  const msgErro = (e: unknown) => (e instanceof Error ? e.message : 'Não foi possível salvar.');
  const salvarNotas = useMutation({
    mutationFn: () => salvarNotasFavorito(empId, f.id, notas),
    onSuccess: () => {
      onSalvou();
      Alert.alert('Pronto', 'Notas salvas.');
    },
    onError: (e) => Alert.alert('Erro', msgErro(e)),
  });
  const salvarEntrevista = useMutation({
    mutationFn: (v: { dataHora: string | null; obs: string | null }) =>
      salvarEntrevistaFavorito(empId, f.id, v.dataHora, v.obs),
    onSuccess: (_r, v) => {
      onSalvou();
      if (!v.dataHora) {
        setDataTxt('');
        setObs('');
      }
      Alert.alert('Pronto', v.dataHora ? 'Entrevista salva.' : 'Entrevista removida.');
    },
    onError: (e) => Alert.alert('Erro', msgErro(e)),
  });

  function aoSalvarEntrevista() {
    const dh = paraFormatoServidor(dataTxt);
    if (!dh) {
      setErroData('Use o formato DD/MM/AAAA HH:MM, com uma data válida.');
      return;
    }
    setErroData(null);
    salvarEntrevista.mutate({ dataHora: dh, obs: obs.trim() || null });
  }

  const ocupado = salvarNotas.isPending || salvarEntrevista.isPending;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetTopo}>
            <Text style={[styles.nome, { flex: 1 }]}>Notas e entrevista · {f.nome}</Text>
            <Pressable
              onPress={onFechar}
              style={styles.fechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.remover}>✕</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }}>
            <Text style={styles.rotulo}>Notas privadas (só a sua empresa vê)</Text>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              multiline
              maxLength={LIMITE}
              value={notas}
              onChangeText={setNotas}
              placeholder="Impressões sobre o candidato..."
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.contador}>{notas.length}/{LIMITE}</Text>
            <Pressable
              style={[styles.btn, ocupado && { opacity: 0.6 }]}
              disabled={ocupado}
              onPress={() => salvarNotas.mutate()}
            >
              {salvarNotas.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnTxt}>Salvar notas</Text>
              )}
            </Pressable>

            <Text style={[styles.rotulo, { marginTop: spacing.md }]}>Entrevista</Text>
            <TextInput
              style={styles.input}
              value={dataTxt}
              onChangeText={(t) => {
                setDataTxt(t);
                setErroData(null);
              }}
              placeholder="DD/MM/AAAA HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={16}
              accessibilityLabel="Data e hora da entrevista"
            />
            {erroData && <Text style={styles.erro}>{erroData}</Text>}
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              multiline
              maxLength={LIMITE}
              value={obs}
              onChangeText={setObs}
              placeholder="Observação (local, link da reunião...)"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.contador}>{obs.length}/{LIMITE}</Text>
            <Pressable
              style={[styles.btn, ocupado && { opacity: 0.6 }]}
              disabled={ocupado}
              onPress={aoSalvarEntrevista}
            >
              {salvarEntrevista.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnTxt}>Salvar entrevista</Text>
              )}
            </Pressable>
            {(f.entrevista_data_hora || dataTxt) && (
              <Pressable
                style={[styles.btnSec, ocupado && { opacity: 0.6 }]}
                disabled={ocupado}
                onPress={() => salvarEntrevista.mutate({ dataHora: null, obs: null })}
              >
                <Text style={styles.btnSecTxt}>Remover entrevista</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FavoritosScreen() {
  const { sessao } = useSession();
  const empId = sessao?.id ?? 0;
  const qc = useQueryClient();
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const q = useQuery({ queryKey: ['favoritos', empId], queryFn: () => getFavoritos(empId) });

  function invalidarTudo() {
    qc.invalidateQueries({ queryKey: ['favoritos'] });
    qc.invalidateQueries({ queryKey: ['status-fav'] });
    qc.invalidateQueries({ queryKey: ['talentos'] });
    qc.invalidateQueries({ queryKey: ['candidato'] });
  }
  const mudar = useMutation({
    mutationFn: (v: { alunoId: number; status: StatusFavorito }) =>
      mudarStatusFavorito(empId, v.alunoId, v.status),
    onSuccess: invalidarTudo,
    onError: () => Alert.alert('Erro', 'Não foi possível mudar o status.'),
  });
  const remover = useMutation({
    mutationFn: (alunoId: number) => desfavoritar(empId, alunoId),
    onSuccess: invalidarTudo,
  });

  const grupos = STATUS_FAVORITO.map((s) => ({
    status: s,
    itens: (q.data ?? []).filter((f) => f.status === s),
  })).filter((g) => g.itens.length > 0);

  const selecionado = q.data?.find((x) => x.id === detalheId);

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <Titulo>Favoritos</Titulo>
      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Erro ao carregar favoritos.' : null}
        vazio={q.data?.length === 0}
        vazioTexto="Nenhum candidato favoritado ainda. Favorite no Portal de Talentos."
        onRetry={q.refetch}
      />

      {grupos.map((g) => (
        <View key={g.status} style={{ gap: spacing.sm }}>
          <View style={styles.grupoHead}>
            <View style={[styles.dot, { backgroundColor: COR[g.status] }]} />
            <Text style={styles.grupoTit}>
              {ROTULO[g.status]} · {g.itens.length}
            </Text>
          </View>
          {g.itens.map((f) => {
            const idx = STATUS_FAVORITO.indexOf(f.status);
            const prox = STATUS_FAVORITO[(idx + 1) % STATUS_FAVORITO.length];
            return (
              <Card key={f.id}>
                <View style={styles.linha}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{f.nome}</Text>
                    <Text style={styles.sub}>
                      {[f.curso, f.semestre ? `${f.semestre}º sem.` : null].filter(Boolean).join(' · ')}
                      {f.media_geral != null ? ` · CRA ${f.media_geral}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => remover.mutate(f.id)} hitSlop={10}>
                    <Text style={styles.remover}>✕</Text>
                  </Pressable>
                </View>
                {f.entrevista_data_hora ? (
                  <Text style={styles.entrevista}>
                    Entrevista: {paraCampoData(f.entrevista_data_hora)}
                  </Text>
                ) : null}
                <View style={styles.acoes}>
                  <Pressable
                    style={[styles.mover, { borderColor: COR[prox] }]}
                    onPress={() => mudar.mutate({ alunoId: f.id, status: prox })}
                  >
                    <Text style={[styles.moverTxt, { color: COR[prox] }]}>→ {ROTULO[prox]}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.mover, { borderColor: colors.border }]}
                    onPress={() => setDetalheId(f.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Notas e entrevista de ${f.nome}`}
                  >
                    <Text style={[styles.moverTxt, { color: colors.text }]}>Notas e entrevista</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      ))}

      {selecionado ? (
        <NotasEntrevistaModal
          key={selecionado.id}
          f={selecionado}
          empId={empId}
          onFechar={() => setDetalheId(null)}
          onSalvou={() => qc.invalidateQueries({ queryKey: ['favoritos'] })}
        />
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  grupoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  grupoTit: { ...typography.h3, color: colors.text },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nome: { ...typography.h3, color: colors.text },
  sub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  remover: { color: colors.textMuted, fontSize: 16, padding: 2 },
  entrevista: { ...typography.tiny, color: colors.warning, marginTop: spacing.xs, fontWeight: '700' },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  mover: {
    borderWidth: 1, borderRadius: radius.pill, minHeight: 44, justifyContent: 'center',
    paddingVertical: 5, paddingHorizontal: spacing.md,
  },
  moverTxt: { ...typography.small, fontWeight: '700' },
  fechar: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.md, maxHeight: '90%',
  },
  sheetTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  rotulo: { ...typography.small, color: colors.text, fontWeight: '700' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm,
    color: colors.text, minHeight: 44,
  },
  contador: { ...typography.tiny, color: colors.textMuted, textAlign: 'right' },
  erro: { ...typography.tiny, color: colors.danger },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.pill, minHeight: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  btnTxt: { ...typography.small, color: '#fff', fontWeight: '700' },
  btnSec: {
    borderWidth: 1, borderColor: colors.danger, borderRadius: radius.pill, minHeight: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecTxt: { ...typography.small, color: colors.danger, fontWeight: '700' },
});
