import type { CSSProperties } from 'react';

/** Paleta do app de vôlei: chão cor de areia, tinta quente e um laranja
 * escuro o bastante pra texto branco em cima (contraste ≥ 4.5:1). */
export const color = {
  ground: '#F5F2EC',
  groundDeep: '#EDE7DD',
  surface: '#FFFFFF',
  ink: '#1A1814',
  inkSoft: '#292524',
  onInkMuted: '#D6D3D1',
  muted: '#6B645A',
  subtle: '#A8A29E',
  line: '#E6E0D6',
  lineSoft: '#EFEAE2',
  lineStrong: '#D6CFC4',
  accent: '#C2410C',
  accentSoft: '#FFEDD5',
  accentTint: '#FFF7ED',
  accentOnInk: '#FDBA74',
  live: '#15803D',
  liveDot: '#16A34A',
  holdingBg: '#FEF3C7',
  holdingFg: '#854D0E',
  draftFg: '#1E40AF',
  danger: '#B91C1C',
  maleBg: '#DBEAFE',
  maleFg: '#1E40AF',
  femaleBg: '#FCE7F3',
  femaleFg: '#9D174D',
} as const;

export const font = {
  display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  body: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

/** Largura máxima do conteúdo: o app é pensado pro celular; no desktop fica
 * uma coluna centralizada. Barras fixas usam o mesmo limite. */
export const CONTENT_MAX_WIDTH = 480;

/** Altura da barra de navegação inferior (sem a safe area). */
export const NAV_HEIGHT = 68;

export const fixedBar: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  margin: '0 auto',
  maxWidth: CONTENT_MAX_WIDTH,
  zIndex: 10,
};

export const card: CSSProperties = {
  background: color.surface,
  borderRadius: 18,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

export const displayTitle: CSSProperties = {
  fontFamily: font.display,
  fontWeight: 700,
  lineHeight: 1.05,
  margin: 0,
};

export const sectionLabel: CSSProperties = {
  margin: '0 4px',
  fontSize: 13,
  fontWeight: 600,
  color: color.muted,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

/** Botão "limpo" (sem borda/fundo) com alvo de toque de 44px. */
export const iconButton: CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  color: color.ink,
  fontSize: 20,
  cursor: 'pointer',
};

export const primaryButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 50,
  border: 'none',
  borderRadius: 14,
  background: color.accent,
  color: '#FFFFFF',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};

export const secondaryButton: CSSProperties = {
  ...primaryButton,
  minHeight: 48,
  border: `1.5px solid ${color.lineStrong}`,
  background: color.surface,
  color: color.ink,
  fontSize: 15,
};

export const disabledButton: CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
};

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
