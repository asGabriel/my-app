import { useState } from 'react';
import dayjs from 'dayjs';
import { useDeleteFinanceIncome, type Income } from '../api';
import { money } from '../finance/format';

interface IncomeDeleteSheetProps {
  income: Income;
  privado: boolean;
  onClose: () => void;
}

/** Confirma a exclusão de uma receita. */
export function IncomeDeleteSheet({ income, privado, onClose }: IncomeDeleteSheetProps) {
  const deleteIncome = useDeleteFinanceIncome();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteIncome.mutateAsync({ incomeId: income.id });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir a receita.');
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="field-kicker">Excluir receita</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17, marginTop: 4 }}>{income.description}</div>

        <div
          style={{
            marginTop: 16, padding: '13px 14px', borderRadius: 'var(--radius-md)', display: 'grid', gap: 6,
            border: '1px solid var(--color-danger)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-neutral-200)',
          }}
        >
          <div>
            {money(parseFloat(income.amount), privado)} recebidos em {dayjs(income.receivedDate).format('DD/MM/YYYY')} deixam
            de contar na renda do mês.
          </div>
          <div>Essa ação não pode ser desfeita por aqui.</div>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

        <button
          className="btn btn-block"
          disabled={deleteIncome.isPending}
          onClick={handleDelete}
          style={{ marginTop: 20, justifyContent: 'center', background: 'var(--color-danger)', color: 'var(--color-neutral-100)', border: 0 }}
        >
          {deleteIncome.isPending ? 'Excluindo…' : 'Excluir'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8, justifyContent: 'center' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
