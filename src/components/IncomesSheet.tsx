import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useFinanceIncomes, type Income } from '../api';
import { MESES_LONGOS } from '../finance/FinanceMonthContext';
import { money } from '../finance/format';
import { incomeCategoryIcon } from '../finance/categoryIcon';
import { INCOME_CATEGORY_LABELS } from '../utils/constants';
import { IncomeSheet } from './IncomeSheet';
import { IncomeDeleteSheet } from './IncomeDeleteSheet';
import { SwipeableRow, type SwipeAction, type SwipeSide } from './SwipeableRow';

interface IncomesSheetProps {
  year: number;
  month0: number;
  privado: boolean;
  onClose: () => void;
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

/** Receitas de um mês, abertas a partir do card "Renda" da aba Mês, com
 * edição e exclusão por linha. Registrar uma nova é pela aba Novo. */
export function IncomesSheet({ year, month0, privado, onClose }: IncomesSheetProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleting, setDeleting] = useState<Income | null>(null);
  // Uma linha com ações à mostra por vez: abrir outra fecha a anterior.
  const [swiped, setSwiped] = useState<{ id: string; side: SwipeSide } | null>(null);

  const filters = useMemo(() => {
    const first = dayjs(new Date(year, month0, 1));
    return { startDate: first.format('YYYY-MM-DD'), endDate: first.endOf('month').format('YYYY-MM-DD') };
  }, [year, month0]);
  const { data, isLoading, isError, error, refetch } = useFinanceIncomes(filters);

  // A API já devolve por data de recebimento (ORDER BY received_date ASC).
  const incomes = useMemo(() => data ?? [], [data]);
  const total = useMemo(() => incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0), [incomes]);

  const goRegister = () => navigate('/novo', { state: { kind: 'receita' } });

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-grabber" />
          <div className="field-kicker">Receitas de {MESES_LONGOS[month0]}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', marginTop: 4 }}>
            {money(total, privado)}
          </div>

          <div style={{ marginTop: 10 }}>
            {isLoading ? (
              <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '20px 0' }}>Carregando…</div>
            ) : isError ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
                  {error instanceof Error ? error.message : 'Erro ao carregar as receitas.'}
                </div>
                <button className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: 12 }}>
                  Tentar de novo
                </button>
              </div>
            ) : incomes.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '20px 0', lineHeight: 1.5 }}>
                Nenhuma receita registrada em {MESES_LONGOS[month0]}.
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

          <button className="btn btn-primary btn-block" onClick={goRegister} style={{ marginTop: 16, justifyContent: 'center' }}>
            <i className="ph ph-plus" /> Registrar receita
          </button>
          <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8, justifyContent: 'center' }}>
            Fechar
          </button>
        </div>
      </div>

      {/* Depois da lista no DOM, para abrir por cima dela. */}
      {editing && <IncomeSheet income={editing} onClose={() => setEditing(null)} />}
      {deleting && <IncomeDeleteSheet income={deleting} privado={privado} onClose={() => setDeleting(null)} />}
    </>
  );
}
