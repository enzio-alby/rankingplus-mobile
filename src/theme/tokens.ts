/**
 * Tokens de marca do Ranking+ — copiados do `css/design-tokens.css` do web
 * (azul-marinho quase-preto + laranja-vermelho) mais a paleta de status que
 * as páginas do web usam (verde/amarelo/vermelho) e tons de cinza.
 * Fonte única de cor do app — nenhuma tela deve hardcodar hex.
 */
export const colors = {
  // Marca (design-tokens.css do web)
  primary: '#020122',
  accent: '#F4442E',

  // Superfícies
  bg: '#FFFFFF',
  bgMuted: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',

  // Texto
  text: '#1F2937',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',

  // Status (mesmos tons usados no drawer do Portal de Talentos)
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',

  // Faixas de compatibilidade (alinhado ao web)
  compatAlta: '#16A34A',
  compatMedia: '#D97706',
  compatBaixa: '#6B7280',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
} as const;
