import { useState } from 'react';
import {
  useCreateFinanceList,
  useUpdateFinanceDebt,
  type Debt,
  type DebtCategory,
  type DebtList,
  type ExpenseType,
  type UpdateDebtRequest,
} from '../api';
import { installmentCountOf, isInstallment } from '../finance/debt';
import { DEBT_CATEGORY_OPTIONS, EXPENSE_TYPE_OPTIONS } from '../utils/constants';

interface DebtEditSheetProps {
  debt: Debt;
  /** Pai do parcelamento, quando `debt` é uma parcela. */
  parent?: Debt;
  lists: DebtList[];
  onClose: () => void;
}

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

/** Edita descrição, categoria, tipo, vencimento e lista de um débito.
 * Parcela não é editável no backend: a edição vai pelo pai, que propaga
 * descrição, categoria, tipo e lista para todas as parcelas. O vencimento de
 * cada parcela é fixo, então o campo só aparece em débito comum. */
export function DebtEditSheet({ debt, parent, lists, onClose }: DebtEditSheetProps) {
  const updateDebt = useUpdateFinanceDebt();
  const createList = useCreateFinanceList();

  const installment = isInstallment(debt);
  const targetId = debt.parentId ?? debt.id;
  // As parcelas guardam uma cópia dos campos do pai; sem o pai carregado, vale a cópia.
  const source = parent ?? debt;
  const installmentCount = installmentCountOf(debt, parent);

  const [form, setForm] = useState({
    description: source.description,
    category: source.category as DebtCategory,
    expenseType: source.expenseType as ExpenseType,
    dueDate: debt.dueDate ?? '',
    listId: source.listId ?? null,
  });
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isPending = updateDebt.isPending || createList.isPending;
  const description = form.description.trim();

  /** Só os campos alterados: ausente = o backend mantém o valor atual. */
  const changes = (): UpdateDebtRequest => {
    const data: UpdateDebtRequest = {};
    if (description !== source.description) data.description = description;
    if (form.category !== source.category) data.category = form.category;
    if (form.expenseType !== source.expenseType) data.expenseType = form.expenseType;
    if (form.listId !== (source.listId ?? null)) data.listId = form.listId;
    if (!installment && form.dueDate && form.dueDate !== debt.dueDate) data.dueDate = form.dueDate;
    return data;
  };

  const run = (action: () => Promise<void>, fallback: string) => {
    setError(null);
    action().catch((e) => setError(e instanceof Error ? e.message : fallback));
  };

  const handleCreateList = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      const list = await createList.mutateAsync({ name });
      setForm((f) => ({ ...f, listId: list.id }));
      setNewName('');
    }, 'Erro ao criar a lista.');
  };

  const handleSave = () => {
    if (!description) return setError('Informe uma descrição.');
    const data = changes();
    if (Object.keys(data).length === 0) return onClose();
    run(async () => {
      await updateDebt.mutateAsync({ debtId: targetId, data });
      onClose();
    }, 'Erro ao salvar o débito.');
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="field-kicker">Editar débito</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17, marginTop: 4 }}>{debt.description}</div>
        {installment && (
          <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 4, lineHeight: 1.5 }}>
            Vale para {installmentCount ? `as ${installmentCount} parcelas` : 'todas as parcelas'} deste parcelamento.
          </div>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="debt-edit-description">Descrição</label>
          <input
            className="input"
            id="debt-edit-description"
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        {!installment && (
          <div className="field" style={{ marginTop: 14, maxWidth: 180 }}>
            <label htmlFor="debt-edit-due-date">Vencimento</label>
            <input
              className="input"
              id="debt-edit-due-date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div className="field-kicker" style={{ paddingBottom: 8 }}>Categoria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEBT_CATEGORY_OPTIONS.map((c) => (
              <button key={c.value} className={pillClass(form.category === c.value)} onClick={() => setForm((f) => ({ ...f, category: c.value }))}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="field-kicker" style={{ paddingBottom: 8 }}>Tipo de despesa</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {EXPENSE_TYPE_OPTIONS.map((t) => (
              <button key={t.value} className={pillClass(form.expenseType === t.value)} onClick={() => setForm((f) => ({ ...f, expenseType: t.value }))}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="field-kicker" style={{ paddingBottom: 8 }}>Lista</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button className={pillClass(form.listId === null)} onClick={() => setForm((f) => ({ ...f, listId: null }))}>
              Sem lista
            </button>
            {lists.map((l) => (
              <button key={l.id} className={pillClass(form.listId === l.id)} onClick={() => setForm((f) => ({ ...f, listId: l.id }))}>
                {l.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              className="input"
              type="text"
              placeholder="Nova lista"
              aria-label="Nome da nova lista"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              style={{ flex: '1 1 auto', minWidth: 0 }}
            />
            <button className="btn btn-secondary" disabled={isPending || !newName.trim()} onClick={handleCreateList} style={{ flex: '0 0 auto' }}>
              Criar
            </button>
          </div>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

        <button
          className="btn btn-primary btn-block"
          disabled={isPending || !description}
          onClick={handleSave}
          style={{ marginTop: 20, justifyContent: 'center' }}
        >
          {isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8, justifyContent: 'center' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
