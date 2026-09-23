import { HorizontalScroller } from '../../components/HorizontalScroller';
import { useFinanceMonth } from '../../finance/FinanceMonthContext';

export function MonthChips() {
  const { months, mi, setMi } = useFinanceMonth();

  return (
    <HorizontalScroller activeIndex={mi} ariaLabel="Selecionar mês">
      {months.map((m, i) => {
        const active = i === mi;
        return (
          <button
            key={`${m.year}-${m.month0}`}
            onClick={() => setMi(i)}
            className={active ? 'pill pill-active' : 'pill'}
            aria-pressed={active}
          >
            {m.chip}
          </button>
        );
      })}
    </HorizontalScroller>
  );
}
