import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { schemas, useFinanceDebts, type Debt, type DebtFilters } from '../../api';
import { useFinanceMonth, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { categoryIcon } from '../../finance/categoryIcon';
import { EXPENSE_TYPE_LABELS } from '../../utils/constants';
import { MonthChips } from './MonthChips';

type StatusFilter = 'all' | 'open' | 'settled';

const STATUS_OPTIONS: { v: StatusFilter; label: string }[] = [
  { v: 'all', label: 'Todas' },
  { v: 'open', label: 'Em aberto' },
  { v: 'settled', label: 'Quitadas' },
];

/** Lista plana do mês selecionado: débitos comuns + parcelas (filhas) que
 * vencem nele. Com filtro de data o backend já deixa o pai do parcelamento de
 * fora (ele não tem `due_date`), então o pai é buscado à parte (ver DebtsTab). */
function buildFilters(filter: StatusFilter, year: number, month0: number): DebtFilters {
  const first = dayjs(new Date(year, month0, 1));
  const base: DebtFilters = {
    includeChildren: true,
    startDate: first.format('YYYY-MM-DD'),
    endDate: first.endOf('month').format('YYYY-MM-DD'),
  };
  if (filter === 'open') return { ...base, statuses: [schemas.DebtStatus.enum.OPEN] };
  if (filter === 'settled') return { ...base, statuses: [schemas.DebtStatus.enum.SETTLED] };
  return base;
}

function DebtTag({ debt, privado }: { debt: Debt; privado: boolean }) {
  const remaining = parseFloat(debt.remainingAmount);
  const paid = parseFloat(debt.paidAmount);
  if (debt.status === schemas.DebtStatus.enum.SETTLED) return <span style={{ color: 'var(--color-neutral-500)' }}>quitada</span>;
  if (paid > 0.01) return <span style={{ color: 'var(--color-accent-300)' }}>falta {short(remaining, privado)}</span>;
  return <span style={{ color: 'var(--color-neutral-500)' }}>em aberto</span>;
}

/** Linha única e curta: "1/3 · 10/10 · resta R$ 1.000" (parcela) ou "vence 10/10 · fixa".
 * A contagem de parcelas e o restante vêm do pai: nas filhas o backend pode devolver a contagem nula. */
function subtitle(debt: Debt, parent: Debt | undefined, privado: boolean): string {
  const due = debt.dueDate ? dayjs(debt.dueDate).format('DD/MM') : null;
  if (!debt.parentId) {
    return [due && `vence ${due}`, EXPENSE_TYPE_LABELS[debt.expenseType].toLowerCase()].filter(Boolean).join(' · ');
  }
  const count = parent?.installmentCount ?? debt.installmentCount ?? '?';
  const rest = parent && `resta ${short(parseFloat(parent.remainingAmount), privado)}`;
  return [`${debt.installmentNumber}/${count}`, due, rest].filter(Boolean).join(' · ');
}

function DebtRow({ debt, parent, privado }: { debt: Debt; parent?: Debt; privado: boolean }) {
  const settled = debt.status === schemas.DebtStatus.enum.SETTLED;

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', gap: 12, alignItems: 'center',
        padding: '11px 0', borderTop: '1px solid var(--color-divider)', opacity: settled ? 0.55 : 1,
      }}
    >
      <div className="avatar-icon" style={{ width: 34, height: 34, fontSize: 16 }}>
        <i className={categoryIcon(debt.category)} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {debt.description}
        </div>
        <div
          style={{
            fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {subtitle(debt, parent, privado)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {money(parseFloat(debt.totalAmount), privado)}
        </div>
        <div style={{ fontSize: 11, marginTop: 2 }}><DebtTag debt={debt} privado={privado} /></div>
      </div>
    </div>
  );
}

export function DebtsTab() {
  const { privado, togglePrivado, selected } = useFinanceMonth();
  const { year, month0 } = selected;
  const [filter, setFilter] = useState<StatusFilter>('all');
  const { data, isLoading, isError, error, refetch } = useFinanceDebts(buildFilters(filter, year, month0));

  // A API já devolve por vencimento (ORDER BY due_date ASC).
  const debts = useMemo(() => data ?? [], [data]);

  // Pais dos parcelamentos que aparecem no mês (total/restante da compra).
  const parentIds = useMemo(
    () => Array.from(new Set(debts.flatMap((d) => (d.parentId ? [d.parentId] : [])))),
    [debts]
  );
  const { data: parents } = useFinanceDebts({ ids: parentIds }, parentIds.length > 0);
  const parentsById = useMemo(() => new Map((parents ?? []).map((p) => [p.id, p])), [parents]);

  const totals = useMemo(
    () => debts.reduce(
      (acc, d) => ({ total: acc.total + parseFloat(d.totalAmount), remaining: acc.remaining + parseFloat(d.remainingAmount) }),
      { total: 0, remaining: 0 }
    ),
    [debts]
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 16 }}>Débitos</div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={togglePrivado}
          aria-label={privado ? 'Mostrar valores' : 'Ocultar valores'}
          style={{ width: 34, height: 34, fontSize: 16 }}
        >
          <i className={privado ? 'ph ph-eye-slash' : 'ph ph-eye'} />
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <MonthChips />
      </div>

      <div className="mzs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginTop: 12 }}>
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.v}
            onClick={() => setFilter(o.v)}
            className={filter === o.v ? 'pill pill-active' : 'pill'}
            style={{ flex: '0 0 auto' }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
        <div className="card" style={{ padding: '11px 12px 12px' }}>
          <div className="card-kicker">Total</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{short(totals.total, privado)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>{debts.length} débitos</div>
        </div>
        <div className="card" style={{ padding: '11px 12px 12px' }}>
          <div className="card-kicker">Falta pagar</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{short(totals.remaining, privado)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>vencendo em {MESES_LONGOS[month0]}</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {isLoading ? (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>Carregando…</div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
              {error instanceof Error ? error.message : 'Erro ao carregar os débitos.'}
            </div>
            <button className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: 12 }}>
              Tentar de novo
            </button>
          </div>
        ) : debts.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>
            Nenhum débito em {MESES_LONGOS[month0]}.
          </div>
        ) : (
          debts.map((d) => <DebtRow key={d.id} debt={d} parent={d.parentId ? parentsById.get(d.parentId) : undefined} privado={privado} />)
        )}
      </div>
    </div>
  );
}
