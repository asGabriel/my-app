import { useRef, useState, type PointerEvent, type ReactNode, type MouseEvent } from 'react';

/** Lado cujas ações estão à mostra: `start` = à esquerda (deslize da esquerda
 * para a direita), `end` = à direita (deslize da direita para a esquerda). */
export type SwipeSide = 'start' | 'end';

export interface SwipeAction {
  key: string;
  label: string;
  icon: string;
  tone?: 'accent' | 'neutral' | 'danger';
  onClick: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  /** Reveladas ao deslizar da esquerda para a direita. */
  startActions?: SwipeAction[];
  /** Reveladas ao deslizar da direita para a esquerda. */
  endActions?: SwipeAction[];
  /** Controlado pelo pai, para manter uma linha aberta por vez. */
  open: SwipeSide | null;
  onOpenChange: (side: SwipeSide | null) => void;
}

const ACTION_WIDTH = 76;
/** Deslocamento mínimo para decidir se o gesto é horizontal ou rolagem. */
const AXIS_LOCK_PX = 8;

type Gesture = { x: number; y: number; base: number; axis: 'x' | 'y' | null };

/** Linha com ações escondidas atrás do conteúdo, reveladas por deslize
 * (toque ou mouse). Soltar além da metade da largura das ações abre o lado;
 * antes disso volta ao lugar. Com a linha aberta, tocar no conteúdo só fecha. */
export function SwipeableRow({ children, startActions = [], endActions = [], open, onOpenChange }: SwipeableRowProps) {
  const startWidth = startActions.length * ACTION_WIDTH;
  const endWidth = endActions.length * ACTION_WIDTH;
  const restOffset = open === 'start' ? startWidth : open === 'end' ? -endWidth : 0;

  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  // O click dispara depois do pointerup; um arraste não pode virar "tap".
  const suppressClick = useRef(false);

  const offset = dragOffset ?? restOffset;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, base: restOffset, axis: null };
    suppressClick.current = false;
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.axis !== 'x') return;

    suppressClick.current = true;
    setDragOffset(Math.min(startWidth, Math.max(-endWidth, g.base + dx)));
  };

  const handlePointerEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'x' || dragOffset === null) return;

    if (startWidth > 0 && dragOffset > startWidth / 2) onOpenChange('start');
    else if (endWidth > 0 && dragOffset < -endWidth / 2) onOpenChange('end');
    else onOpenChange(null);
    setDragOffset(null);
  };

  const handleClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current || open !== null) {
      e.stopPropagation();
      e.preventDefault();
      suppressClick.current = false;
      if (open !== null) onOpenChange(null);
    }
  };

  const runAction = (action: SwipeAction) => {
    onOpenChange(null);
    action.onClick();
  };

  const renderActions = (actions: SwipeAction[], side: SwipeSide) => (
    <div className={`swipe-actions swipe-actions-${side}`} style={{ width: actions.length * ACTION_WIDTH }}>
      {actions.map((a) => (
        <button
          key={a.key}
          className={`swipe-action swipe-action-${a.tone ?? 'neutral'}`}
          // Fora da tela as ações não devem receber foco via teclado.
          tabIndex={open === side ? 0 : -1}
          onClick={() => runAction(a)}
        >
          <i className={a.icon} />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="swipe-row">
      {/* Só o lado sendo revelado fica visível, para um não vazar por trás do outro. */}
      {offset > 0 && startActions.length > 0 && renderActions(startActions, 'start')}
      {offset < 0 && endActions.length > 0 && renderActions(endActions, 'end')}
      <div
        className="swipe-row-content"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragOffset === null ? 'transform 180ms ease-out' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
