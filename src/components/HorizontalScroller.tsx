import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface HorizontalScrollerProps {
  children: ReactNode;
  /** Índice do filho que deve ficar centralizado na faixa (ex: chip ativo).
   * Ao mudar, a faixa rola suavemente até ele. */
  activeIndex?: number;
  gap?: number;
  style?: CSSProperties;
  ariaLabel?: string;
}

/** Tolerância em px para considerar que a faixa chegou numa das pontas. */
const EDGE_EPSILON = 2;

/**
 * Faixa horizontal rolável para linhas de chips.
 * - esconde a scrollbar e esmaece as bordas quando há conteúdo escondido;
 * - no desktop (dispositivo com hover) mostra setas para rolar;
 * - converte a roda vertical do mouse em rolagem horizontal;
 * - mantém o filho `activeIndex` centralizado.
 */
export function HorizontalScroller({ children, activeIndex, gap = 6, style, ariaLabel }: HorizontalScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > EDGE_EPSILON);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE_EPSILON);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges]);

  // Roda vertical → rolagem horizontal. Só intercepta enquanto ainda há para
  // onde rolar na direção pedida; nas pontas, deixa a página rolar normalmente.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= EDGE_EPSILON;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE_EPSILON;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Centraliza o filho ativo. Não usa scrollIntoView para não rolar a página
  // verticalmente junto.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || activeIndex == null) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    // .hscroll-track é position: relative, então offsetLeft já é relativo a ela.
    const left = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
    el.scrollTo({ left, behavior: didInitialScroll.current ? 'smooth' : 'auto' });
    didInitialScroll.current = true;
    updateEdges();
  }, [activeIndex, updateEdges]);

  const scrollByPage = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const fadeClass = ['hscroll-track', 'mzs', canLeft && 'hscroll-fade-left', canRight && 'hscroll-fade-right']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="hscroll" style={style}>
      {canLeft && (
        <button
          type="button"
          className="hscroll-arrow hscroll-arrow-left"
          onClick={() => scrollByPage(-1)}
          aria-label="Rolar para a esquerda"
          tabIndex={-1}
        >
          <i className="ph ph-caret-left" />
        </button>
      )}
      <div
        ref={trackRef}
        className={fadeClass}
        style={{ gap }}
        onScroll={updateEdges}
        role="group"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      {canRight && (
        <button
          type="button"
          className="hscroll-arrow hscroll-arrow-right"
          onClick={() => scrollByPage(1)}
          aria-label="Rolar para a direita"
          tabIndex={-1}
        >
          <i className="ph ph-caret-right" />
        </button>
      )}
    </div>
  );
}
