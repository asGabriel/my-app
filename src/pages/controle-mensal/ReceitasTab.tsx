import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useFinanceIncomes, type Income, type IncomeFilters } from '../../api';
import { useFinanceMonth, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { incomeCategoryIcon } from '../../finance/categoryIcon';
import { INCOME_CATEGORY_LABELS } from '../../utils/constants';
import { IncomeSheet } from '../../components/IncomeSheet';
import { IncomeDeleteSheet } from '../../components/IncomeDeleteSheet';
import { SwipeableRow, type SwipeAction, type SwipeSide } from '../../components/SwipeableRow';
import { MonthChips } from './MonthChips';

function buildFilters(year: number, month0: number): IncomeFilters {
  const first = dayjs(new Date(year, month0, 1));
  return {
    startDate: first.format('YYYY-MM-DD'),
    endDate: first.endOf('month').format('YYYY-MM-DD'),
  };
}

/** Data sugerida para uma receita nova: hoje, se o mês selecionado é o
 * corrente; senão o dia 1 do mês selecionado. */
function defaultReceivedDate(year: number, month0: number): string {
  const today = dayjs();
  const first = dayjs(new Date(year, month0, 1));
  return (first.isSame(today, 'month') ? today : first).format('YYYY-MM-DD');
}

interface IncomeRowProps {
  income: Income;
  privado: boolean;
  open: SwipeSide | null;
  onOpenChange: (side: SwipeSide | null) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Deslize da direita para a esquerda edita, da esquerda para a direita
 * exclui (como nos débitos); tocar na linha também edita. */
function IncomeRow({ income, privado, open, onOpenChange, onEdit, onDelete }: IncomeRowProps) {
  const endActions: SwipeAction[] = [
    { key: 'edit', label: 'Editar', icon: 'ph ph-pencil-simple', tone: 'neutral', onClick: onEdit },
  ];
  const startActions: SwipeAction[] = [
    { key: 'delete', label: 'Excluir', icon: 'ph ph-trash', tone: 'danger', onClick: onDelete },
  ];

  return (
    <SwipeableRow startActions={startActions} endActions={endActions} open={open} onOpenChange={onOpenChange}>
      <div
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEdit()}
        style={{
          display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) auto', gap: 12, alignItems: 'center',
          padding: '11px 0', cursor: 'pointer',
        }}
      >
        <div className="avatar-icon" style={{ width: 34, height: 34, fontSize: 16 }}>
          <i className={incomeCategoryIcon(income.category)} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {income.description}
          </div>
          <div
            style={{
              fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {`recebido ${dayjs(income.receivedDate).format('DD/MM')} · ${INCOME_CATEGORY_LABELS[income.category].toLowerCase()}`}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', textAlign: 'right' }}>
          {money(parseFloat(income.amount), privado)}
        </div>
      </div>
    </SwipeableRow>
  );
}

export function ReceitasTab() {
  const { privado, togglePrivado, selected, getTotals, hasMonth } = useFinanceMonth();
  const { year, month0 } = selected;
  // `null` = fechado; `'new'` = criando; senão a receita em edição.
  const [editing, setEditing] = useState<Income | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Income | null>(null);
  // Uma linha com ações à mostra por vez: abrir outra fecha a anterior.
  const [swiped, setSwiped] = useState<{ id: string; side: SwipeSide } | null>(null);
  const { data, isLoading, isError, error, refetch } = useFinanceIncomes(buildFilters(year, month0));

  // A API já devolve por data de recebimento (ORDER BY received_date ASC).
  const incomes = useMemo(() => data ?? [], [data]);
  const received = useMemo(() => incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0), [incomes]);
  // Débitos do mês vêm do contexto; fora da janela buscada não há o que comparar.
  const debtsTotal = hasMonth(year, month0) ? getTotals(year, month0).total : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 16 }}>Receitas</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
        <div className="card" style={{ padding: '11px 12px 12px' }}>
          <div className="card-kicker">Recebido</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{short(received, privado)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>
            {incomes.length} {incomes.length === 1 ? 'receita' : 'receitas'}
          </div>
        </div>
        <div className="card" style={{ padding: '11px 12px 12px' }}>
          <div className="card-kicker">Sobra</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>
            {debtsTotal === null ? '—' : short(received - debtsTotal, privado)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>
            {debtsTotal === null ? 'fora da janela carregada' : `após ${short(debtsTotal, privado)} em débitos`}
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={() => setEditing('new')}
        style={{ marginTop: 14, justifyContent: 'center' }}
      >
        <i className="ph ph-plus" /> Nova receita
      </button>

      <div style={{ marginTop: 14 }}>
        {isLoading ? (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>Carregando…</div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
              {error instanceof Error ? error.message : 'Erro ao carregar as receitas.'}
            </div>
            <button className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: 12 }}>
              Tentar de novo
            </button>
          </div>
        ) : incomes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>
            Nenhuma receita em {MESES_LONGOS[month0]}.
          </div>
        ) : (
          incomes.map((i) => (
            <IncomeRow
              key={i.id}
              income={i}
              privado={privado}
              open={swiped?.id === i.id ? swiped.side : null}
              onOpenChange={(side) => setSwiped(side ? { id: i.id, side } : null)}
              onEdit={() => setEditing(i)}
              onDelete={() => setDeleting(i)}
            />
          ))
        )}
      </div>

      {editing && (
        <IncomeSheet
          income={editing === 'new' ? undefined : editing}
          defaultDate={defaultReceivedDate(year, month0)}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && <IncomeDeleteSheet income={deleting} privado={privado} onClose={() => setDeleting(null)} />}
    </div>
  );
}
