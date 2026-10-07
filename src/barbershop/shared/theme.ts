import type { CSSProperties } from 'react';

/** Paleta "Navalha" do protótipo da barbearia: fundo quase preto, tinta
 * marfim e um dourado envelhecido como único acento. O texto escuro sobre o
 * dourado (`onAccent`) mantém contraste ≥ 4.5:1. */
export const color = {
  ground: '#0F0E0C',
  bar: '#12110F',
  surface: '#1A1815',
  surfaceRaised: '#24211D',
  surfaceGold: '#17140F',
  ink: '#EFEAE1',
  muted: '#A39C90',
  subtle: '#6E685E',
  line: '#2A2723',
  lineStrong: '#3A362F',
  lineGold: '#4A3F2C',
  accent: '#CDB07A',
  accentHover: '#E2CA9C',
  onAccent: '#15130F',
  open: '#7FB98A',
  danger: '#E08A7A',
} as const;

export const font = {
  display: "'Bodoni Moda', Georgia, serif",
  body: "Manrope, system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

/** O app é pensado pro celular; no desktop vira uma coluna centralizada e as
 * barras fixas usam o mesmo limite. */
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
  boxSizing: 'border-box',
};

/** Reset de `<button>` para usá-lo como card/linha clicável. */
export const plainButton: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  margin: 0,
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
};

export const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 20,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

/** Card clicável selecionável (serviço, unidade, plano, pagamento). */
export function selectableCard(selected: boolean): CSSProperties {
  return {
    ...plainButton,
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    gap: 16,
    padding: '16px 18px',
    borderRadius: 16,
    background: color.surface,
    border: `1px solid ${selected ? color.accent : color.line}`,
  };
}

export const displayTitle: CSSProperties = {
  margin: 0,
  fontFamily: font.display,
  fontWeight: 500,
  fontSize: 32,
  lineHeight: 1.1,
};

export const eyebrow: CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: color.muted,
};

export const mutedText: CSSProperties = {
  fontSize: 13,
  color: color.muted,
};

export const primaryButton: CSSProperties = {
  ...plainButton,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 52,
  padding: '0 28px',
  borderRadius: 14,
  background: color.accent,
  color: color.onAccent,
  fontSize: 15,
  fontWeight: 700,
  textAlign: 'center',
};

export const outlineButton: CSSProperties = {
  ...primaryButton,
  background: 'transparent',
  border: `1px solid ${color.lineStrong}`,
  color: color.ink,
};

export const roundIconButton: CSSProperties = {
  ...plainButton,
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 22,
  border: `1px solid ${color.line}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
};

export const disabledButton: CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
};

export function pill(variant: 'gold' | 'outline' | 'solid'): CSSProperties {
  const base: CSSProperties = {
    alignSelf: 'flex-start',
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  };
  if (variant === 'solid') return { ...base, background: color.accent, color: color.onAccent, fontWeight: 700 };
  if (variant === 'gold') return { ...base, border: `1px solid ${color.lineGold}`, color: color.accent };
  return { ...base, border: `1px solid ${color.lineStrong}`, color: color.ink };
}
