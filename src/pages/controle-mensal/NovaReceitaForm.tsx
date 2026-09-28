import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { schemas, useCreateFinanceIncome, type IncomeCategory } from '../../api';
import { useFinanceMonth } from '../../finance/FinanceMonthContext';
import { money } from '../../finance/format';
import { INCOME_CATEGORY_LABELS, INCOME_CATEGORY_OPTIONS } from '../../utils/constants';

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

/** Valor digitado ("1.234,56" ou "1234.56") em centavos arredondados — o
 * backend rejeita mais de 2 casas. `NaN` quando não dá para ler. */
function parseAmount(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  return Math.round(parseFloat(normalized) * 100) / 100;
}

/** Data sugerida: hoje, se o mês selecionado é o corrente; senão o dia 1 dele. */
function defaultReceivedDate(year: number, month0: number): string {
  const today = dayjs();
  const first = dayjs(new Date(year, month0, 1));
  return (first.isSame(today, 'month') ? today : first).format('YYYY-MM-DD');
}

interface NovaReceitaFormProps {
  /** Renderizado acima do formulário (o seletor Débito/Receita da aba Novo);
   * some na tela de confirmação. */
  header: ReactNode;
}

/** Registro de receita na aba Novo. Receita só existe depois de recebida
 * (não há receita prevista no backend), então é um passo só: valor,
 * descrição, data de recebimento e categoria. */
export function NovaReceitaForm({ header }: NovaReceitaFormProps) {
  const navigate = useNavigate();
  const { selected } = useFinanceMonth();
  const createIncome = useCreateFinanceIncome();

  const [form, setForm] = useState({
    valor: '',
    nome: '',
    receivedDate: defaultReceivedDate(selected.year, selected.month0),
    categoria: schemas.IncomeCategory.enum.SALARY as IncomeCategory,
  });
  const [done, setDone] = useState<{ name: string; value: string; texto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valorNum = parseAmount(form.valor);
  const validValor = Number.isFinite(valorNum) && valorNum > 0;
  const received = dayjs(form.receivedDate);

  const resetForm = () => {
    setForm((f) => ({ ...f, valor: '', nome: '' }));
    setDone(null);
    setError(null);
  };

  const handleRegistrar = async () => {
    if (!validValor || !form.receivedDate) return;
    const name = form.nome.trim() || INCOME_CATEGORY_LABELS[form.categoria];
    setError(null);
    try {
      await createIncome.mutateAsync({
        description: name,
        amount: valorNum.toFixed(2),
        receivedDate: form.receivedDate,
        category: form.categoria,
      });
      setDone({
        name,
        value: money(valorNum, false),
        texto: `Entrou em ${received.format('DD/MM/YYYY')} e soma à renda de ${received.format('MMM/YY')}.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar a receita.');
    }
  };

  if (done) {
    return (
      <div>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            className="avatar-icon"
            style={{ width: 44, height: 44, fontSize: 22, background: 'var(--color-accent-900)', border: '1px solid var(--color-accent-600)' }}
          >
            <i className="ph ph-check" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17 }}>{done.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-neutral-500)', marginTop: 2 }}>{done.value}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-neutral-400)', marginTop: 16, lineHeight: 1.55 }}>{done.texto}</div>
        <button className="btn btn-primary btn-block" onClick={() => navigate('/')} style={{ marginTop: 20, justifyContent: 'center' }}>
          Ver no mês
        </button>
        <button className="btn btn-ghost btn-block" onClick={resetForm} style={{ marginTop: 8, justifyContent: 'center' }}>
          Registrar outra receita
        </button>
      </div>
    );
  }

  return (
    <div>
      {header}

      <div style={{ padding: '16px 0 0' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          Quanto entrou
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 7, lineHeight: 1.5 }}>
          Registre o dinheiro que já caiu na conta.
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="field-kicker">Valor</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, borderBottom: '1px solid var(--color-accent-700)', paddingBottom: 8 }}>
          <span style={{ fontSize: 19, color: 'var(--color-neutral-500)' }}>R$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            aria-label="Valor"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            style={{
              flex: '1 1 auto', minWidth: 0, background: 'transparent', border: 0, outline: 'none',
              color: 'var(--color-text)', fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 34, letterSpacing: '-0.03em',
            }}
          />
        </div>
      </div>

      <div className="field" style={{ marginTop: 20 }}>
        <label htmlFor="receita-nome">Descrição</label>
        <input
          className="input"
          id="receita-nome"
          type="text"
          placeholder={`Ex.: ${INCOME_CATEGORY_LABELS[form.categoria]}`}
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        />
      </div>

      <div className="field" style={{ marginTop: 16, maxWidth: 180 }}>
        <label htmlFor="receita-data">Recebido em</label>
        <input
          className="input"
          id="receita-data"
          type="date"
          value={form.receivedDate}
          onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="field-kicker" style={{ paddingBottom: 8 }}>Categoria</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INCOME_CATEGORY_OPTIONS.map((c) => (
            <button key={c.value} onClick={() => setForm((f) => ({ ...f, categoria: c.value }))} className={pillClass(form.categoria === c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

      <button
        className="btn btn-primary btn-block"
        onClick={handleRegistrar}
        disabled={createIncome.isPending || !validValor || !form.receivedDate}
        style={{ marginTop: 24, justifyContent: 'center' }}
      >
        {createIncome.isPending ? 'Registrando…' : 'Registrar receita'}
      </button>
    </div>
  );
}
