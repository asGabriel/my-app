import type { ReactNode } from 'react';
import { NAV_HEIGHT, color, fixedBar } from '../shared/theme';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Contador exibido sobre o ícone (ex.: tamanho da fila). */
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
}

/** Barra de navegação fixa no rodapé, no padrão de app nativo: ícone com
 * "pílula" de destaque no item ativo e alvo de toque de 52px. */
export function BottomNav({ items, activeKey, onSelect, ariaLabel }: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      style={{
        ...fixedBar,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        minHeight: NAV_HEIGHT,
        padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
        boxSizing: 'border-box',
        background: color.surface,
        borderTop: `1px solid ${color.line}`,
      }}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 52,
              border: 'none',
              background: 'none',
              color: isActive ? color.accent : color.muted,
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'flex',
                padding: '4px 16px',
                borderRadius: 999,
                background: isActive ? color.accentSoft : 'transparent',
                fontSize: 20,
              }}
            >
              {item.icon}
              {!!item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: 4,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    boxSizing: 'border-box',
                    borderRadius: 999,
                    background: color.ink,
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
