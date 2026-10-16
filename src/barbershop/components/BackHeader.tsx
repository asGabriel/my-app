import { LeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { color, roundIconButton } from '../shared/theme';

interface BackHeaderProps {
  /** Rota de volta; sem ela, volta no histórico. */
  to?: string;
  /** Texto ao lado do botão, ex.: "Passo 1 de 3". */
  caption?: string;
}

export function BackHeader({ to, caption }: BackHeaderProps) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => (to ? navigate(to) : navigate(-1))}
        style={roundIconButton}
      >
        <LeftOutlined />
      </button>
      {caption && <span style={{ fontSize: 13, color: color.muted }}>{caption}</span>}
    </div>
  );
}
