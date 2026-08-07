import { PlusOutlined } from '@ant-design/icons';

interface FabProps {
  onClick: () => void;
  label?: string;
}

export function Fab({ onClick, label = 'Adicionar' }: FabProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 'calc(76px + env(safe-area-inset-bottom))',
        zIndex: 9,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: '#fa8c16',
        color: '#fff',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(250, 140, 22, 0.45)',
        cursor: 'pointer',
      }}
    >
      <PlusOutlined />
    </button>
  );
}
