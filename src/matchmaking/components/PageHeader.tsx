import type { ReactNode } from 'react';
import { color, displayTitle } from '../shared/theme';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

/** Cabeçalho das telas de topo (Sessões, Jogadores): marca "Vôlei" + título grande. */
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header
      style={{
        padding: '24px 4px 16px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: color.accent,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Vôlei
        </span>
        <h1 style={{ ...displayTitle, fontSize: 40, lineHeight: 1 }}>{title}</h1>
      </div>
      {action}
    </header>
  );
}
