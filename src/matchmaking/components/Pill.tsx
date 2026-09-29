import type { ReactNode } from 'react';

/** Etiqueta compacta com cores explícitas (fundo claro + texto escuro). */
export function Pill({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return (
    <span
      style={{
        flexShrink: 0,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color: fg,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
