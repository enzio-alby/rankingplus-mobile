import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPerfilCandidato } from '@/api/empresa';
import { getPerfilProfissional, getDesempenho } from '@/api/aluno';
import type { PerfilProfissional } from '@/api_mobile';

export type DadosRelatorio = {
  nome: string;
  curso: string | null;
  semestre: number | null;
  github: string | null;
  linkedin: string | null;
  metricas: {
    media_geral: number | null;
    frequencia: number;
    posicao_ranking: number | null;
    total_disciplinas: number;
    total_atividades: number;
    total_faltas: number;
  };
  destaque: { nome_materia: string; mencao: string | null }[];
  evolucao: { labels: string[]; values: number[] };
  ats: PerfilProfissional;
  geradoEm: string;
};

/**
 * Monta o "Relatório acadêmico + Currículo ATS" do aluno, mesmas fontes do
 * `exportarPerfilCompletoPDF` do web (`talentos.js`): /talentos/aluno/:id/perfil
 * + /alunos/:id/perfil-profissional + /alunos/:id/desempenho-semestral.
 */
export async function getDadosRelatorio(alunoId: number): Promise<DadosRelatorio> {
  const [cand, ats, evo] = await Promise.all([
    getPerfilCandidato(alunoId),
    getPerfilProfissional(alunoId),
    getDesempenho(alunoId).catch(() => ({ labels: [], values: [] })),
  ]);
  return {
    nome: cand.nome,
    curso: cand.curso,
    semestre: cand.semestre,
    github: cand.github,
    linkedin: cand.linkedin,
    metricas: {
      media_geral: cand.metricas.media_geral,
      frequencia: cand.metricas.frequencia,
      posicao_ranking: cand.metricas.posicao_ranking,
      total_disciplinas: cand.metricas.total_disciplinas,
      total_atividades: cand.metricas.total_atividades,
      total_faltas: cand.metricas.total_faltas,
    },
    destaque: cand.disciplinas_destaque.map((d) => ({ nome_materia: d.nome_materia, mencao: d.mencao })),
    evolucao: { labels: evo.labels ?? [], values: (evo.values ?? []).map(Number) },
    ats,
    geradoEm: new Date().toLocaleString('pt-BR'),
  };
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

const periodo = (a: string | null, b: string | null) =>
  [a, b].map((x) => (x ?? '').trim()).filter(Boolean).join(' a ');

/**
 * HTML do PDF. De propósito SEM `<a href>` — o PDF é "não clicável" (LGPD:
 * carrega métricas + currículo). Links viram texto puro.
 */
export function montarHtmlRelatorio(d: DadosRelatorio): string {
  const m = d.metricas;
  const linha = (rot: string, val: string) =>
    `<div class="row"><span class="k">${esc(rot)}</span><span class="v">${esc(val)}</span></div>`;

  const destaqueHtml = d.destaque.length
    ? `<h2>Disciplinas de destaque (SS/MS)</h2><ul>${d.destaque
        .map((x) => `<li>${esc(x.nome_materia)} — ${esc(x.mencao ?? '')}</li>`)
        .join('')}</ul>`
    : '';

  const evoHtml = d.evolucao.labels.length
    ? `<h2>Evolução do CRA — curso todo</h2><p class="small">${d.evolucao.labels
        .map((l, i) => `${esc(l)}: ${esc(d.evolucao.values[i] ?? '—')}`)
        .join('   •   ')}</p>`
    : '';

  const a = d.ats;
  const expHtml = a.experiencias.length
    ? `<h2>Experiência profissional</h2>${a.experiencias
        .map(
          (e) => `<div class="item"><strong>${esc(
            [e.cargo, e.empresa].filter(Boolean).join(' — '),
          )}</strong>${e.periodo_inicio || e.periodo_fim ? `<div class="small">${esc(periodo(e.periodo_inicio, e.periodo_fim))}</div>` : ''}${
            e.descricao ? `<div>${esc(e.descricao)}</div>` : ''
          }</div>`,
        )
        .join('')}`
    : '';
  const formHtml = a.formacoes.length
    ? `<h2>Formação complementar</h2>${a.formacoes
        .map(
          (f) => `<div class="item"><strong>${esc(
            [f.curso, f.instituicao].filter(Boolean).join(' — '),
          )}</strong>${f.periodo_fim ? `<div class="small">${esc(f.periodo_fim)}</div>` : ''}</div>`,
        )
        .join('')}`
    : '';
  const idiHtml = a.idiomas.length
    ? `<h2>Idiomas</h2><ul>${a.idiomas
        .map((i) => `<li>${esc(i.idioma)}: ${esc(i.nivel)}</li>`)
        .join('')}</ul>`
    : '';
  const habHtml = a.habilidades.length
    ? `<h2>Habilidades</h2><p>${a.habilidades.map(esc).join(' · ')}</p>`
    : '';
  const certHtml = a.certificacoes.length
    ? `<h2>Certificações e cursos</h2><ul>${a.certificacoes
        .map(
          (c) =>
            `<li>${esc([c.nome, c.instituicao].filter(Boolean).join(' — '))}${
              c.data_emissao ? ` (${esc(c.data_emissao)})` : ''
            }</li>`,
        )
        .join('')}</ul>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #16181f; margin: 32px; font-size: 12px; line-height: 1.5; }
    h1 { font-size: 20px; margin: 0 0 2px; }
    h2 { font-size: 13px; margin: 18px 0 6px; border-bottom: 1px solid #c9ccd6; padding-bottom: 3px; text-transform: uppercase; letter-spacing: .04em; }
    .sub { color: #5b6270; margin-bottom: 4px; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; }
    .k { color: #5b6270; }
    .v { font-weight: 600; }
    .item { margin-bottom: 8px; }
    .small { color: #5b6270; font-size: 11px; }
    ul { margin: 4px 0; padding-left: 18px; }
    .page-break { page-break-before: always; }
    .foot { margin-top: 24px; color: #8a909c; font-size: 10px; }
  </style></head><body>
    <h1>${esc(d.nome || 'Aluno')}</h1>
    <div class="sub">${esc(d.curso || '—')}${d.semestre ? ` · ${esc(d.semestre)}º semestre` : ''}</div>

    <h2>Desempenho acadêmico</h2>
    ${linha('CRA geral', m.media_geral != null ? String(m.media_geral) : '—')}
    ${linha('Frequência', `${Math.round(m.frequencia)}%`)}
    ${linha('Posição no ranking', m.posicao_ranking != null ? `#${m.posicao_ranking}` : '—')}
    ${linha('Disciplinas cursadas', String(m.total_disciplinas))}
    ${linha('Atividades entregues', String(m.total_atividades))}
    ${linha('Faltas registradas', String(m.total_faltas))}
    ${evoHtml}
    ${destaqueHtml}

    <h2>Contato</h2>
    ${linha('GitHub', d.github || 'não informado')}
    ${linha('LinkedIn', d.linkedin || 'não informado')}

    <div class="page-break"></div>
    <h1>Currículo</h1>
    <div class="sub">${esc(d.nome || 'Aluno')} · ${esc(d.curso || '—')}</div>
    ${a.resumo ? `<h2>Resumo profissional</h2><p>${esc(a.resumo)}</p>` : ''}
    ${expHtml}
    ${formHtml}
    ${idiHtml}
    ${habHtml}
    ${certHtml}

    <div class="foot">Gerado pelo app Ranking+ em ${esc(d.geradoEm)} · documento sem links (LGPD)</div>
  </body></html>`;
}

/** Gera o PDF e abre a folha de compartilhamento do sistema. */
export async function exportarRelatorioPdf(d: DadosRelatorio): Promise<void> {
  const html = montarHtmlRelatorio(d);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Relatório — ${d.nome}`,
    });
  }
}
