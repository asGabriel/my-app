import { useState } from 'react';
import { useCreateFinanceList, useUpdateFinanceDebt, type Debt, type DebtList } from '../api';
import { installmentCountOf, isInstallment } from '../finance/debt';

interface DebtListSheetProps {
  debt: Debt;
  /** Pai do parcelamento, quando `debt` é uma parcela. */
  parent?: Debt;
  lists: DebtList[];
  onClose: () => void;
}

/** Vincula/desvincula um débito de uma lista (agrupador). Parcela não é
 * editável no backend: o vínculo vai pelo pai, que propaga para todas as
 * parcelas. */
export function DebtListSheet({ debt, parent, lists, onClose }: DebtListSheetProps) {
  const updateDebt = useUpdateFinanceDebt();
  const createList = useCreateFinanceList();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const targetId = debt.parentId ?? debt.id;
  const current = (parent ?? debt).listId ?? null;
  const installmentCount = installmentCountOf(debt, parent);
  const isPending = updateDebt.isPending || createList.isPending;

  const link = async (listId: string | null) => {
    if (listId === current) return onClose();
    await updateDebt.mutateAsync({ debtId: targetId, data: { listId } });
    onClose();
  };

  const run = (action: () => Promise<void>) => {
    setError(null);
    action().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao salvar a lista.'));
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      const list = await createList.mutateAsync({ name });
      await link(list.id);
    });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="field-kicker">Lista</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17, marginTop: 4 }}>{debt.description}</div>
        {isInstallment(debt) && (
          <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 4, lineHeight: 1.5 }}>
            Vale para {installmentCount ? `as ${installmentCount} parcelas` : 'todas as parcelas'} deste parcelamento.
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          <button className={current === null ? 'pill pill-active' : 'pill'} disabled={isPending} onClick={() => run(() => link(null))}>
            Sem lista
          </button>
          {lists.map((l) => (
            <button
              key={l.id}
              className={current === l.id ? 'pill pill-active' : 'pill'}
              disabled={isPending}
              onClick={() => run(() => link(l.id))}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            className="input"
            type="text"
            placeholder="Nova lista"
            aria-label="Nome da nova lista"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ flex: '1 1 auto', minWidth: 0 }}
          />
          <button className="btn btn-secondary" disabled={isPending || !newName.trim()} onClick={handleCreate} style={{ flex: '0 0 auto' }}>
            Criar
          </button>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 18, justifyContent: 'center' }}>
          {isPending ? 'Salvando…' : 'Fechar'}
        </button>
      </div>
    </div>
  );
}
