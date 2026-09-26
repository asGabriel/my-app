import { useState } from 'react';
import { useDeleteFinanceDebt, type Debt } from '../api';
import { debtAmounts, installmentCountOf, isInstallment } from '../finance/debt';
import { money } from '../finance/format';

interface DebtDeleteSheetProps {
  debt: Debt;
  /** Pai do parcelamento, quando `debt` é uma parcela. */
  parent?: Debt;
  privado: boolean;
  onClose: () => void;
}

/** Confirma a exclusão de um débito. Parcela não é excluída sozinha (o total
 * do parcelamento ficaria inconsistente): a exclusão vai pelo pai, e o backend
 * leva junto todas as parcelas e os pagamentos delas. */
export function DebtDeleteSheet({ debt, parent, privado, onClose }: DebtDeleteSheetProps) {
  const deleteDebt = useDeleteFinanceDebt();
  const [error, setError] = useState<string | null>(null);

  const installment = isInstallment(debt);
  const targetId = debt.parentId ?? debt.id;
  const installmentCount = installmentCountOf(debt, parent);
  // Sem o pai carregado não dá para somar o parcelamento; o aviso fica sem valores.
  const amounts = installment ? parent && debtAmounts(parent) : debtAmounts(debt);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteDebt.mutateAsync({ debtId: targetId });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir o débito.');
    }
  };

  const consequences = installment
    ? [
        `Exclui o parcelamento inteiro: ${installmentCount ? `as ${installmentCount} parcelas` : 'todas as parcelas'}`
          + (amounts ? `, ${money(amounts.total, privado)} no total` : '')
          + '.',
        amounts && amounts.paid > 0.01
          ? `Os pagamentos já registrados (${money(amounts.paid, privado)}) também são excluídos.`
          : 'Os pagamentos já registrados nas parcelas também são excluídos.',
      ]
    : [
        amounts && amounts.paid > 0.01
          ? `Os pagamentos já registrados (${money(amounts.paid, privado)}) também são excluídos.`
          : null,
      ];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="field-kicker">{installment ? 'Excluir parcelamento' : 'Excluir débito'}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17, marginTop: 4 }}>{debt.description}</div>

        <div
          style={{
            marginTop: 16, padding: '13px 14px', borderRadius: 'var(--radius-md)', display: 'grid', gap: 6,
            border: '1px solid var(--color-danger)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-neutral-200)',
          }}
        >
          {consequences.filter(Boolean).map((c) => <div key={c}>{c}</div>)}
          <div>Essa ação não pode ser desfeita por aqui.</div>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

        <button
          className="btn btn-block"
          disabled={deleteDebt.isPending}
          onClick={handleDelete}
          style={{ marginTop: 20, justifyContent: 'center', background: 'var(--color-danger)', color: 'var(--color-neutral-100)', border: 0 }}
        >
          {deleteDebt.isPending ? 'Excluindo…' : installment ? 'Excluir parcelamento' : 'Excluir'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8, justifyContent: 'center' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
