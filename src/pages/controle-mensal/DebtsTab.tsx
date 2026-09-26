import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useFinanceDebtParents, useFinanceDebts, useFinanceLists, type Debt, type DebtFilters, type DebtList } from '../../api';
import { debtAmounts, installmentCountOf, isInstallment, isOpen, isSettled, parentOf } from '../../finance/debt';
import { useFinanceMonth, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { categoryIcon } from '../../finance/categoryIcon';
import { EXPENSE_TYPE_LABELS } from '../../utils/constants';
import { DebtEditSheet } from '../../components/DebtEditSheet';
import { MonthChips } from './MonthChips';

type StatusFilter = 'all' | 'open' | 'settled';

const STATUS_OPTIONS: { v: StatusFilter; label: string }[] = [
  { v: 'all', label: 'Todas' },
  { v: 'open', label: 'Em aberto' },
  { v: 'settled', label: 'Quitadas' },
];

/** `null` = "Todos". Qualquer outro valor é o `id` de uma lista. */
type ListFilter = string | null;

/** Lista plana do mês selecionado: débitos comuns + parcelas (filhas) que
 * vencem nele. Com filtro de data o backend já deixa o pai do parcelamento de
 * fora (ele não tem `due_date`), então o pai é buscado à parte (ver DebtsTab).
 * Status e lista são filtrados no cliente sobre o mês inteiro, para os chips
 * de lista não sumirem/aparecerem ao trocar o status. */
function buildFilters(year: number, month0: number): DebtFilters {
  const first = dayjs(new Date(year, month0, 1));
  return {
    includeChildren: true,
    startDate: first.format('YYYY-MM-DD'),
    endDate: first.endOf('month').format('YYYY-MM-DD'),
  };
}

function matchesStatus(debt: Debt, filter: StatusFilter): boolean {
  if (filter === 'open') return isOpen(debt);
  if (filter === 'settled') return isSettled(debt);
  return true;
}

/** Chips de lista, no estilo dos filtros do WhatsApp: "Todos" + só as listas
 * que têm algum débito no mês. Sem nenhuma lista no mês, a linha nem aparece. */
function ListChips({ lists, value, onChange }: { lists: DebtList[]; value: ListFilter; onChange: (v: ListFilter) => void }) {
  if (lists.length === 0) return null;

  const options: { v: ListFilter; label: string }[] = [
    { v: null, label: 'Todos' },
    ...lists.map((l) => ({ v: l.id, label: l.name })),
  ];

  return (
    <div className="mzs" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginTop: 12 }}>
      {options.map((o) => (
        <button
          key={o.v ?? 'all'}
          onClick={() => onChange(o.v)}
          className={value === o.v ? 'pill pill-active' : 'pill'}
          style={{ flex: '0 0 auto' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DebtTag({ debt, privado }: { debt: Debt; privado: boolean }) {
  const { remaining, paid } = debtAmounts(debt);
  if (isSettled(debt)) return <span style={{ color: 'var(--color-neutral-500)' }}>quitada</span>;
  if (paid > 0.01) return <span style={{ color: 'var(--color-accent-300)' }}>falta {short(remaining, privado)}</span>;
  return <span style={{ color: 'var(--color-neutral-500)' }}>em aberto</span>;
}

/** Linha única e curta: "1/3 · 10/10 · resta R$ 1.000" (parcela) ou "vence 10/10 · fixa",
 * seguida do nome da lista quando houver.
 * A contagem de parcelas e o restante vêm do pai: nas filhas o backend pode devolver a contagem nula. */
function subtitle(debt: Debt, parent: Debt | undefined, listName: string | undefined, privado: boolean): string {
  const due = debt.dueDate ? dayjs(debt.dueDate).format('DD/MM') : null;
  if (!isInstallment(debt)) {
    return [due && `vence ${due}`, EXPENSE_TYPE_LABELS[debt.expenseType].toLowerCase(), listName].filter(Boolean).join(' · ');
  }
  const count = installmentCountOf(debt, parent) ?? '?';
  const rest = parent && `resta ${short(debtAmounts(parent).remaining, privado)}`;
  return [`${debt.installmentNumber}/${count}`, due, rest, listName].filter(Boolean).join(' · ');
}

interface DebtRowProps {
  debt: Debt;
  parent?: Debt;
  listName?: string;
  privado: boolean;
  onClick: () => void;
}

function DebtRow({ debt, parent, listName, privado, onClick }: DebtRowProps) {
  const settled = isSettled(debt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', gap: 12, alignItems: 'center',
        padding: '11px 0', borderTop: '1px solid var(--color-divider)', opacity: settled ? 0.55 : 1, cursor: 'pointer',
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
          {subtitle(debt, parent, listName, privado)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {money(debtAmounts(debt).total, privado)}
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
  const [listFilter, setListFilter] = useState<ListFilter>(null);
  const [editing, setEditing] = useState<Debt | null>(null);
  const { data, isLoading, isError, error, refetch } = useFinanceDebts(buildFilters(year, month0));
  const { data: allLists } = useFinanceLists();
  const lists = useMemo(() => allLists ?? [], [allLists]);
  const listsById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);

  // A API já devolve por vencimento (ORDER BY due_date ASC).
  const monthDebts = useMemo(() => data ?? [], [data]);

  // Só as listas com débito no mês, na ordem de criação que a API devolve.
  const monthLists = useMemo(() => {
    const used = new Set(monthDebts.flatMap((d) => (d.listId ? [d.listId] : [])));
    return lists.filter((l) => used.has(l.id));
  }, [monthDebts, lists]);

  // Lista selecionada que não existe no mês novo cai para "Todos".
  const activeList = monthLists.some((l) => l.id === listFilter) ? listFilter : null;

  const debts = useMemo(
    () => monthDebts.filter((d) => matchesStatus(d, filter) && (activeList === null || d.listId === activeList)),
    [monthDebts, filter, activeList]
  );

  // Pais dos parcelamentos que aparecem no mês (total/restante da compra).
  const { parentsById } = useFinanceDebtParents(debts);

  const totals = useMemo(
    () => debts.reduce(
      (acc, d) => {
        const { total, remaining } = debtAmounts(d);
        return { total: acc.total + total, remaining: acc.remaining + remaining };
      },
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

      <ListChips lists={monthLists} value={activeList} onChange={setListFilter} />

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
          debts.map((d) => (
            <DebtRow
              key={d.id}
              debt={d}
              parent={parentOf(d, parentsById)}
              // Com uma lista filtrada o nome seria redundante em toda linha.
              listName={activeList === null && d.listId ? listsById.get(d.listId)?.name : undefined}
              privado={privado}
              onClick={() => setEditing(d)}
            />
          ))
        )}
      </div>

      {editing && (
        <DebtEditSheet
          debt={editing}
          parent={parentOf(editing, parentsById)}
          lists={lists}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
