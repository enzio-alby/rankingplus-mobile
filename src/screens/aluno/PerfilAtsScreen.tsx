import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import {
  getPerfilProfissional,
  salvarPerfilProfissional,
  getAreasFoco,
} from '@/api/aluno';
import type {
  PPExperiencia,
  PPFormacao,
  PPIdioma,
  PPCertificacao,
} from '@/api_mobile';
import { ScreenScroll, Titulo, Card, Estado } from '@/components/ui';
import { SelectPill } from '@/components/filtro';
import { colors, spacing, radius, typography } from '@/theme/tokens';

const NIVEIS_IDIOMA = ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'];

const EXP_VAZIA: PPExperiencia = { empresa: '', cargo: '', periodo_inicio: '', periodo_fim: '', descricao: '' };
const FORM_VAZIA: PPFormacao = { curso: '', instituicao: '', periodo_inicio: '', periodo_fim: '' };
const IDIOMA_VAZIO: PPIdioma = { idioma: '', nivel: 'Básico' };
const CERT_VAZIA: PPCertificacao = { nome: '', instituicao: '', data_emissao: '' };

export function PerfilAtsScreen() {
  const { sessao } = useSession();
  const qc = useQueryClient();
  const id = sessao?.id ?? 0;
  const podeEditar = sessao?.tipo === 'aluno';

  const q = useQuery({ queryKey: ['perfil-ats', id], queryFn: () => getPerfilProfissional(id) });
  const areas = useQuery({ queryKey: ['areas-foco'], queryFn: getAreasFoco });

  const [editando, setEditando] = useState(false);
  const [resumo, setResumo] = useState('');
  const [areaId, setAreaId] = useState<number | null>(null);
  const [experiencias, setExperiencias] = useState<PPExperiencia[]>([]);
  const [formacoes, setFormacoes] = useState<PPFormacao[]>([]);
  const [idiomas, setIdiomas] = useState<PPIdioma[]>([]);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [certificacoes, setCertificacoes] = useState<PPCertificacao[]>([]);
  const [novaHab, setNovaHab] = useState('');

  useEffect(() => {
    if (!q.data) return;
    setResumo(q.data.resumo ?? '');
    setAreaId(q.data.area_interesse_id ?? null);
    setExperiencias(q.data.experiencias.map((e) => ({ ...e })));
    setFormacoes(q.data.formacoes.map((f) => ({ ...f })));
    setIdiomas(q.data.idiomas.map((i) => ({ ...i })));
    setHabilidades([...q.data.habilidades]);
    setCertificacoes(q.data.certificacoes.map((c) => ({ ...c })));
  }, [q.data]);

  const m = useMutation({
    mutationFn: () =>
      salvarPerfilProfissional(id, {
        resumo: resumo.trim(),
        area_interesse_id: areaId,
        experiencias: experiencias.filter((e) => e.empresa.trim() || e.cargo.trim()),
        formacoes: formacoes.filter((f) => f.curso.trim() || f.instituicao.trim()),
        idiomas: idiomas.filter((i) => i.idioma.trim()),
        habilidades: habilidades.map((h) => h.trim()).filter(Boolean),
        certificacoes: certificacoes.filter((c) => c.nome.trim()),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil-ats', id] });
      qc.invalidateQueries({ queryKey: ['candidato'] });
      setEditando(false);
      Alert.alert('Pronto', 'Currículo atualizado.');
    },
    onError: (e) => Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.'),
  });

  function cancelar() {
    if (q.data) {
      setResumo(q.data.resumo ?? '');
      setAreaId(q.data.area_interesse_id ?? null);
      setExperiencias(q.data.experiencias.map((e) => ({ ...e })));
      setFormacoes(q.data.formacoes.map((f) => ({ ...f })));
      setIdiomas(q.data.idiomas.map((i) => ({ ...i })));
      setHabilidades([...q.data.habilidades]);
      setCertificacoes(q.data.certificacoes.map((c) => ({ ...c })));
    }
    setEditando(false);
  }

  const areaOpcoes = [
    { label: 'Não informado', value: null as string | null },
    ...(areas.data ?? []).map((a) => ({ label: a.nome, value: String(a.id) })),
  ];
  // Prioriza o nome da lista carregada (reflete a troca na hora); só cai pro
  // nome que veio no payload quando a área ainda é a original.
  const areaNome =
    (areas.data ?? []).find((a) => a.id === areaId)?.nome ??
    (areaId === (q.data?.area_interesse_id ?? null) ? q.data?.area_interesse_nome ?? null : null);

  function addHabilidade() {
    const h = novaHab.trim();
    if (h && !habilidades.some((x) => x.toLowerCase() === h.toLowerCase())) {
      setHabilidades((a) => [...a, h]);
    }
    setNovaHab('');
  }

  return (
    <ScreenScroll onRefresh={q.refetch} refreshing={q.isRefetching}>
      <View style={styles.top}>
        <Titulo>Currículo</Titulo>
        {podeEditar && q.data && (
          <Pressable
            onPress={() => (editando ? cancelar() : setEditando(true))}
            accessibilityRole="button"
            accessibilityLabel={editando ? 'Cancelar edição do currículo' : 'Editar currículo'}
          >
            <Text style={styles.editar}>{editando ? 'Cancelar' : 'Editar'}</Text>
          </Pressable>
        )}
      </View>

      <Estado
        carregando={q.isLoading}
        erro={q.isError ? 'Não foi possível carregar o currículo.' : null}
        onRetry={q.refetch}
      />

      {q.data && (
        <>
          {/* ── Resumo ── */}
          <Secao titulo="Resumo profissional" />
          <Card>
            {editando ? (
              <TextInput
                style={[styles.input, styles.multiline]}
                value={resumo}
                onChangeText={setResumo}
                placeholder="Um parágrafo sobre você, seus objetivos e áreas de interesse."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            ) : (
              <Text style={styles.texto}>{resumo || 'Nenhum resumo informado.'}</Text>
            )}
          </Card>

          {/* ── Área de interesse ── */}
          <Secao titulo="Área de interesse" />
          <Card>
            {editando ? (
              <SelectPill
                label={areaNome ?? 'Escolher área'}
                value={areaId != null ? String(areaId) : null}
                options={areaOpcoes}
                onChange={(v) => setAreaId(v ? Number(v) : null)}
              />
            ) : (
              <Text style={styles.texto}>{areaNome || 'Não informada.'}</Text>
            )}
          </Card>

          {/* ── Experiências ── */}
          <Secao
            titulo="Experiências"
            onAdd={editando ? () => setExperiencias((a) => [...a, { ...EXP_VAZIA }]) : undefined}
          />
          {experiencias.length === 0 && !editando && <Vazio texto="Nenhuma experiência." />}
          {experiencias.map((e, i) => (
            <Card key={`exp-${i}`}>
              {editando ? (
                <>
                  <LinhaRemover onRemove={() => setExperiencias((a) => a.filter((_, k) => k !== i))} />
                  <Campo label="Empresa" value={e.empresa} onChange={(v) => patch(setExperiencias, i, { empresa: v })} />
                  <Campo label="Cargo" value={e.cargo} onChange={(v) => patch(setExperiencias, i, { cargo: v })} />
                  <View style={styles.dupla}>
                    <View style={styles.metade}>
                      <Campo label="Início" value={e.periodo_inicio ?? ''} onChange={(v) => patch(setExperiencias, i, { periodo_inicio: v })} />
                    </View>
                    <View style={styles.metade}>
                      <Campo label="Fim" value={e.periodo_fim ?? ''} onChange={(v) => patch(setExperiencias, i, { periodo_fim: v })} />
                    </View>
                  </View>
                  <Campo
                    label="Descrição"
                    value={e.descricao}
                    onChange={(v) => patch(setExperiencias, i, { descricao: v })}
                    multiline
                  />
                </>
              ) : (
                <>
                  <Text style={styles.itemTit}>{e.cargo || '—'}</Text>
                  <Text style={styles.itemSub}>
                    {[e.empresa, periodo(e.periodo_inicio, e.periodo_fim)].filter(Boolean).join(' · ')}
                  </Text>
                  {!!e.descricao && <Text style={styles.itemDesc}>{e.descricao}</Text>}
                </>
              )}
            </Card>
          ))}

          {/* ── Formações ── */}
          <Secao
            titulo="Formação acadêmica"
            onAdd={editando ? () => setFormacoes((a) => [...a, { ...FORM_VAZIA }]) : undefined}
          />
          {formacoes.length === 0 && !editando && <Vazio texto="Nenhuma formação." />}
          {formacoes.map((f, i) => (
            <Card key={`form-${i}`}>
              {editando ? (
                <>
                  <LinhaRemover onRemove={() => setFormacoes((a) => a.filter((_, k) => k !== i))} />
                  <Campo label="Curso" value={f.curso} onChange={(v) => patch(setFormacoes, i, { curso: v })} />
                  <Campo label="Instituição" value={f.instituicao} onChange={(v) => patch(setFormacoes, i, { instituicao: v })} />
                  <View style={styles.dupla}>
                    <View style={styles.metade}>
                      <Campo label="Início" value={f.periodo_inicio ?? ''} onChange={(v) => patch(setFormacoes, i, { periodo_inicio: v })} />
                    </View>
                    <View style={styles.metade}>
                      <Campo label="Fim" value={f.periodo_fim ?? ''} onChange={(v) => patch(setFormacoes, i, { periodo_fim: v })} />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.itemTit}>{f.curso || '—'}</Text>
                  <Text style={styles.itemSub}>
                    {[f.instituicao, periodo(f.periodo_inicio, f.periodo_fim)].filter(Boolean).join(' · ')}
                  </Text>
                </>
              )}
            </Card>
          ))}

          {/* ── Idiomas ── */}
          <Secao
            titulo="Idiomas"
            onAdd={editando ? () => setIdiomas((a) => [...a, { ...IDIOMA_VAZIO }]) : undefined}
          />
          {idiomas.length === 0 && !editando && <Vazio texto="Nenhum idioma." />}
          {idiomas.map((it, i) => (
            <Card key={`idi-${i}`}>
              {editando ? (
                <>
                  <LinhaRemover onRemove={() => setIdiomas((a) => a.filter((_, k) => k !== i))} />
                  <Campo label="Idioma" value={it.idioma} onChange={(v) => patch(setIdiomas, i, { idioma: v })} />
                  <Text style={styles.label}>Nível</Text>
                  <SelectPill
                    label={it.nivel || 'Nível'}
                    value={it.nivel || null}
                    options={NIVEIS_IDIOMA.map((n) => ({ label: n, value: n }))}
                    onChange={(v) => patch(setIdiomas, i, { nivel: v ?? 'Básico' })}
                  />
                </>
              ) : (
                <Text style={styles.itemTit}>
                  {it.idioma || '—'} <Text style={styles.itemSub}>· {it.nivel || '—'}</Text>
                </Text>
              )}
            </Card>
          ))}

          {/* ── Habilidades ── */}
          <Secao titulo="Habilidades" />
          <Card>
            <View style={styles.chips}>
              {habilidades.length === 0 && <Text style={styles.texto}>Nenhuma habilidade.</Text>}
              {habilidades.map((h, i) => (
                <View key={`hab-${i}`} style={styles.chip}>
                  <Text style={styles.chipTxt}>{h}</Text>
                  {editando && (
                    <Pressable
                      onPress={() => setHabilidades((a) => a.filter((_, k) => k !== i))}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover habilidade ${h}`}
                    >
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
            {editando && (
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={novaHab}
                  onChangeText={setNovaHab}
                  placeholder="Nova habilidade"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addHabilidade}
                  returnKeyType="done"
                />
                <Pressable
                  style={styles.addBtn}
                  onPress={addHabilidade}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar habilidade"
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            )}
          </Card>

          {/* ── Certificações ── */}
          <Secao
            titulo="Certificações"
            onAdd={editando ? () => setCertificacoes((a) => [...a, { ...CERT_VAZIA }]) : undefined}
          />
          {certificacoes.length === 0 && !editando && <Vazio texto="Nenhuma certificação." />}
          {certificacoes.map((c, i) => (
            <Card key={`cert-${i}`}>
              {editando ? (
                <>
                  <LinhaRemover onRemove={() => setCertificacoes((a) => a.filter((_, k) => k !== i))} />
                  <Campo label="Nome" value={c.nome} onChange={(v) => patch(setCertificacoes, i, { nome: v })} />
                  <Campo
                    label="Instituição"
                    value={c.instituicao ?? ''}
                    onChange={(v) => patch(setCertificacoes, i, { instituicao: v })}
                  />
                  <Campo
                    label="Emissão"
                    value={c.data_emissao ?? ''}
                    onChange={(v) => patch(setCertificacoes, i, { data_emissao: v })}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.itemTit}>{c.nome || '—'}</Text>
                  <Text style={styles.itemSub}>
                    {[c.instituicao, c.data_emissao].filter(Boolean).join(' · ')}
                  </Text>
                </>
              )}
            </Card>
          ))}

          {editando && (
            <Pressable
              style={[styles.salvar, m.isPending && { opacity: 0.6 }]}
              disabled={m.isPending}
              onPress={() => m.mutate()}
              accessibilityRole="button"
              accessibilityLabel="Salvar currículo"
              accessibilityState={{ disabled: m.isPending, busy: m.isPending }}
            >
              {m.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarTxt}>Salvar</Text>}
            </Pressable>
          )}
        </>
      )}
    </ScreenScroll>
  );
}

/** Aplica um patch parcial no item `i` de um array em estado. */
function patch<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, campos: Partial<T>) {
  setter((arr) => arr.map((item, k) => (k === i ? { ...item, ...campos } : item)));
}

function periodo(ini: string | null, fim: string | null) {
  const a = (ini ?? '').trim();
  const b = (fim ?? '').trim();
  if (a && b) return `${a} — ${b}`;
  return a || b || '';
}

function Secao({ titulo, onAdd }: { titulo: string; onAdd?: () => void }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTit}>{titulo}</Text>
      {onAdd && (
        <Pressable
          onPress={onAdd}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${titulo.toLowerCase()}`}
        >
          <Ionicons name="add-circle" size={22} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <Text style={styles.vazio}>{texto}</Text>;
}

function LinhaRemover({ onRemove }: { onRemove: () => void }) {
  return (
    <Pressable
      style={styles.remover}
      onPress={onRemove}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Remover item"
    >
      <Ionicons name="trash-outline" size={16} color={colors.danger} />
      <Text style={styles.removerTxt}>Remover</Text>
    </Pressable>
  );
}

function Campo({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
      />
    </>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editar: { ...typography.small, color: colors.accent, fontWeight: '700' },
  secao: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, marginBottom: 2,
  },
  secaoTit: { ...typography.h3, color: colors.text },
  vazio: { ...typography.small, color: colors.textMuted, paddingVertical: spacing.xs },
  texto: { ...typography.body, color: colors.text },
  itemTit: { ...typography.body, color: colors.text, fontWeight: '700' },
  itemSub: { ...typography.small, color: colors.textMuted, marginTop: 1 },
  itemDesc: { ...typography.small, color: colors.text, marginTop: spacing.xs },
  label: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  dupla: { flexDirection: 'row', gap: spacing.sm },
  metade: { flex: 1 },
  remover: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  removerTxt: { ...typography.tiny, color: colors.danger, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 5, backgroundColor: colors.surfaceAlt,
  },
  chipTxt: { ...typography.small, color: colors.text },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  salvar: {
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.lg,
  },
  salvarTxt: { ...typography.h3, color: '#fff' },
});
