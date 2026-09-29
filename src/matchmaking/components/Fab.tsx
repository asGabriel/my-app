import { PlusOutlined } from '@ant-design/icons';
import { CONTENT_MAX_WIDTH, NAV_HEIGHT, color } from '../shared/theme';

interface FabProps {
  onClick: () => void;
  label?: string;
}

/** Botão flutuante estendido (ícone + texto), acima da barra inferior e ao
 * alcance do polegar. Alinhado à coluna de conteúdo no desktop. */
export function Fab({ onClick, label = 'Adicionar' }: FabProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: `calc(${NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))`,
        zIndex: 9,
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <button
        onClick={onClick}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 56,
          padding: '0 22px 0 18px',
          border: 'none',
          borderRadius: 18,
          background: color.accent,
          color: '#FFFFFF',
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 600,
          boxShadow: '0 8px 20px rgba(154, 52, 18, 0.35)',
          cursor: 'pointer',
        }}
      >
        <PlusOutlined style={{ fontSize: 20 }} />
        {label}
      </button>
    </div>
  );
}
