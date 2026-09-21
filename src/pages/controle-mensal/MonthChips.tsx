import { useFinanceMonth } from '../../finance/FinanceMonthContext';

export function MonthChips() {
  const { months, mi, setMi } = useFinanceMonth();

  return (
    <div className="mzs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {months.map((m, i) => {
        const active = i === mi;
        return (
          <button
            key={`${m.year}-${m.month0}`}
            onClick={() => setMi(i)}
            className={active ? 'pill pill-active' : 'pill'}
            style={{ flex: '0 0 auto' }}
          >
            {m.chip}
          </button>
        );
      })}
    </div>
  );
}
