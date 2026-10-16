import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { NAV_HEIGHT, color, fixedBar } from '../shared/theme';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Ativo só na rota exata (para o item da raiz). */
  end?: boolean;
}

/** Barra de abas fixa no rodapé — ícone sobre o rótulo, dourado no item ativo. */
export function BottomNav({ items, ariaLabel }: { items: BottomNavItem[]; ariaLabel: string }) {
  return (
    <nav
      aria-label={ariaLabel}
      style={{
        ...fixedBar,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        minHeight: NAV_HEIGHT,
        padding: '10px 8px calc(10px + env(safe-area-inset-bottom))',
        background: color.bar,
        borderTop: `1px solid ${color.line}`,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            minHeight: 44,
            fontSize: 11,
            fontWeight: isActive ? 700 : 500,
            textDecoration: 'none',
            color: isActive ? color.accent : color.muted,
          })}
        >
          <span style={{ fontSize: 21, display: 'flex' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
