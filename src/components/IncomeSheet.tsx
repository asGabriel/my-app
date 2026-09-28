import { useState } from 'react';
import { useUpdateFinanceIncome, type Income, type UpdateIncomeRequest } from '../api';
import { INCOME_CATEGORY_OPTIONS } from '../utils/constants';

interface IncomeSheetProps {
  income: Income;
  onClose: () => void;
}

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

/** Valor digitado ("1.234,56" ou "1234.56") em centavos arredondados — o
 * backend rejeita mais de 2 casas. `NaN` quando não dá para ler. */
function parseAmount(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  return Math.round(parseFloat(normalized) * 100) / 100;
}

/** Edita descrição, valor, data de recebimento e categoria de uma receita;
 * só os campos alterados vão para o backend. Criar é pela aba Novo. */
export function IncomeSheet({ income, onClose }: IncomeSheetProps) {
  const updateIncome = useUpdateFinanceIncome();

  const [form, setForm] = useState({
    description: income.description,
    amount: income.amount.replace('.', ','),
    receivedDate: income.receivedDate,
    category: income.category,
  });
  const [error, setError] = useState<string | null>(null);

  const description = form.description.trim();
  const amount = parseAmount(form.amount);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const canSave = !!description && validAmount && !!form.receivedDate;

  /** Só os campos alterados: ausente = o backend mantém o valor atual. */
  const changes = (): UpdateIncomeRequest => {
    const data: UpdateIncomeRequest = {};
    if (description !== income.description) data.description = description;
    if (amount !== parseFloat(income.amount)) data.amount = amount.toFixed(2);
    if (form.receivedDate !== income.receivedDate) data.receivedDate = form.receivedDate;
    if (form.category !== income.category) data.category = form.category;
    return data;
  };

  const handleSave = async () => {
    if (!canSave) return;
    const data = changes();
    if (Object.keys(data).length === 0) return onClose();
    setError(null);
    try {
      await updateIncome.mutateAsync({ incomeId: income.id, data });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar a receita.');
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="field-kicker">Editar receita</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17, marginTop: 4 }}>{income.description}</div>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="income-description">Descrição</label>
          <input
            className="input"
            id="income-description"
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
          <div className="field">
            <label htmlFor="income-amount">Valor (R$)</label>
            <input
              className="input"
              id="income-amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="income-received-date">Recebido em</label>
            <input
              className="input"
              id="income-received-date"
              type="date"
              value={form.receivedDate}
              onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="field-kicker" style={{ paddingBottom: 8 }}>Categoria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INCOME_CATEGORY_OPTIONS.map((c) => (
              <button key={c.value} className={pillClass(form.category === c.value)} onClick={() => setForm((f) => ({ ...f, category: c.value }))}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

        <button
          className="btn btn-primary btn-block"
          disabled={updateIncome.isPending || !canSave}
          onClick={handleSave}
          style={{ marginTop: 20, justifyContent: 'center' }}
        >
          {updateIncome.isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 8, justifyContent: 'center' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
