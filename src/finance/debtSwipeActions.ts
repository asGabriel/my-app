import type { SwipeAction } from '../components/SwipeableRow';

interface DebtSwipeHandlers {
  /** Sem nada em aberto o "Pagar" some. */
  canPay: boolean;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Ações de deslize de uma linha de débito: da direita para a esquerda,
 * pagar e editar; da esquerda para a direita, excluir. */
export function debtSwipeActions({ canPay, onPay, onEdit, onDelete }: DebtSwipeHandlers) {
  const endActions: SwipeAction[] = [
    ...(canPay ? [{ key: 'pay', label: 'Pagar', icon: 'ph ph-check-circle', tone: 'accent' as const, onClick: onPay }] : []),
    { key: 'edit', label: 'Editar', icon: 'ph ph-pencil-simple', tone: 'neutral', onClick: onEdit },
  ];
  const startActions: SwipeAction[] = [
    { key: 'delete', label: 'Excluir', icon: 'ph ph-trash', tone: 'danger', onClick: onDelete },
  ];
  return { startActions, endActions };
}
