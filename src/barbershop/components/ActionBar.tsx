import type { ReactNode } from 'react';
import { color, fixedBar } from '../shared/theme';

/** Altura reservada no fim da página para o conteúdo não ficar sob a barra. */
export const ACTION_BAR_SPACE = 120;

/** Barra fixa no rodapé das telas sem abas (fluxo de agendamento, unidades):
 * resumo à esquerda e a ação principal à direita — ou só a ação. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...fixedBar,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 24px calc(20px + env(safe-area-inset-bottom))',
        background: color.bar,
        borderTop: `1px solid ${color.line}`,
      }}
    >
      {children}
    </div>
  );
}

/** Bloco de resumo (rótulo pequeno + valor) usado à esquerda da ActionBar. */
export function ActionSummary({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: color.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
