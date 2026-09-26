import { useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import {
  schemas,
  useCreateFinanceDebt,
  type CreateDebtRequest,
  type ExpenseType,
} from '../../api';
import { useFinanceMonth } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { DEBT_CATEGORY_OPTIONS, type DebtCategory } from '../../utils/constants';

type Tipo = 'parcelado' | 'fixo' | 'avulso';

// `fixo` fica escondido até o módulo `finance` ter recorrência.
const TIPO_OPTIONS: { v: Tipo; label: string; desc: string; hidden?: boolean }[] = [
  { v: 'parcelado', label: 'Parcelado', desc: 'Tem fim. Ex.: 12x do notebook.' },
  { v: 'fixo', label: 'Recorrente fixo', desc: 'Mesmo valor todo mês, sem fim.', hidden: true },
  { v: 'avulso', label: 'Avulso', desc: 'Acontece uma vez só, neste mês.' },
];

function dateForDay(year: number, month0: number, day: number): dayjs.Dayjs {
  const base = dayjs(new Date(year, month0, 1));
  const clamped = Math.min(Math.max(day, 1), base.daysInMonth());
  return base.date(clamped);
}

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

export function NovoTab() {
  const navigate = useNavigate();
  const { selected, getTotals, hasMonth } = useFinanceMonth();

  const createDebt = useCreateFinanceDebt();

  const [step, setStep] = useState(1);
  /** Mês de início, em meses a partir do mês selecionado no Controle Mensal. */
  const [startOffset, setStartOffset] = useState(0);
  const [done, setDone] = useState<{ name: string; value: string; texto: string; impacto: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    categoria: 'HOME' as DebtCategory,
    tipo: 'parcelado' as Tipo,
    n: '12',
    dia: '10',
    expenseType: schemas.ExpenseType.enum.VARIABLE as ExpenseType,
  });

  // Arredonda para centavos: o backend rejeita valores com mais de 2 casas.
  const valorNum = Math.round((parseFloat(form.valor.replace(',', '.')) || 0) * 100) / 100;
  const nParc = Math.max(2, Math.min(48, parseInt(form.n, 10) || 12));
  const diaNum = Math.max(1, Math.min(28, parseInt(form.dia, 10) || 10));
  const start = dayjs(new Date(selected.year, selected.month0, 1)).add(startOffset, 'month');
  const year = start.year();
  const month0 = start.month();
  const due = dateForDay(year, month0, diaNum);
  const startLabel = start.format('MMM/YY');
  const endLabel = start.add(nParc - 1, 'month').format('MMM/YY');
  const totals = getTotals(year, month0);

  const isPending = createDebt.isPending;

  const previewTexto =
    form.tipo === 'parcelado'
      ? `${nParc} lançamentos de ${money(valorNum, false)}, de ${startLabel} a ${endLabel}. Total ${money(valorNum * nParc, false)}.`
      : form.tipo === 'avulso'
        ? `1 lançamento de ${money(valorNum, false)} em ${startLabel}, sem repetição.`
        : `Um lançamento por mês a partir de ${startLabel}, sem data de fim (${money(valorNum, false)}/mês).`;

  // Fora da janela buscada pelo contexto não há totais para comparar.
  const impacto = !hasMonth(year, month0)
    ? null
    : form.tipo === 'parcelado'
      ? `As parcelas somam ${short(totals.parcelas + valorNum, false)} no mês. O livre de ${startLabel} cai para ${short(totals.livre - valorNum, false)}.`
      : form.tipo === 'avulso'
        ? `Afeta só ${startLabel}: o livre do mês cai para ${short(totals.livre - valorNum, false)}.`
        : `Seu custo fixo mensal vai para ${short(totals.fixos + valorNum, false)}, sem data de fim.`;

  const resetForm = () => {
    setForm((f) => ({ ...f, nome: '', valor: '' }));
    setStartOffset(0);
    setStep(1);
    setDone(null);
    setError(null);
  };

  const handleAvancar = () => {
    if (step === 1 && !valorNum) return;
    if (step < 3) return setStep(step + 1);

    setError(null);
    const run = async () => {
      if (form.tipo === 'fixo') {
        throw new Error('Recorrência ainda não está disponível');
      }

      const payload: CreateDebtRequest =
        form.tipo === 'parcelado'
          ? {
              description: form.nome.trim() || 'Nova despesa',
              dueDate: due.format('YYYY-MM-DD'),
              totalAmount: (valorNum * nParc).toFixed(2),
              category: form.categoria,
              installmentCount: nParc,
            }
          : {
              description: form.nome.trim() || 'Nova despesa',
              dueDate: due.format('YYYY-MM-DD'),
              totalAmount: valorNum.toFixed(2),
              category: form.categoria,
              expenseType: form.expenseType,
            };
      await createDebt.mutateAsync(payload);
      setDone({ name: form.nome.trim() || 'Nova despesa', value: money(valorNum, false), texto: previewTexto, impacto });
    };

    run().catch((e) => setError(e instanceof Error ? e.message : 'Erro ao criar lançamento'));
  };

  const handleVoltar = () => {
    if (done) return resetForm();
    if (step > 1) return setStep(step - 1);
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
        {done.impacto && (
          <div style={{ fontSize: 13, color: 'var(--color-accent-200)', marginTop: 10, lineHeight: 1.55 }}>{done.impacto}</div>
        )}
        <button className="btn btn-primary btn-block" onClick={() => navigate('/')} style={{ marginTop: 20, justifyContent: 'center' }}>
          Ver no mês
        </button>
        <button className="btn btn-ghost btn-block" onClick={resetForm} style={{ marginTop: 8, justifyContent: 'center' }}>
          Cadastrar outra despesa
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost btn-icon" onClick={handleVoltar} aria-label="Voltar" style={{ width: 30, height: 30, fontSize: 15, flex: '0 0 auto' }} disabled={step === 1}>
          <i className="ph ph-arrow-left" />
        </button>
        <div style={{ flex: '1 1 auto', display: 'flex', gap: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: '1 1 0', height: 3, borderRadius: 999, background: i <= step ? 'var(--color-accent-500)' : 'var(--color-neutral-800)' }} />
          ))}
        </div>
        <div style={{ flex: '0 0 auto', fontSize: 11, color: 'var(--color-neutral-500)' }}>{step} de 3</div>
      </div>

      <div style={{ padding: '16px 0 0' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {['Quanto e o quê', 'Como isso se repete', 'Confira antes de criar'][step - 1]}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 7, lineHeight: 1.5 }}>
          {['Comece pelo valor. O resto a gente pergunta depois.', 'É isso que define quantos lançamentos vão ser gerados.', 'Nada é criado até você confirmar.'][step - 1]}
        </div>
      </div>

      {step === 1 && (
        <div>
          <div style={{ marginTop: 22 }}>
            <div className="field-kicker">{form.tipo === 'parcelado' ? 'Valor da parcela' : 'Valor'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, borderBottom: '1px solid var(--color-accent-700)', paddingBottom: 8 }}>
              <span style={{ fontSize: 19, color: 'var(--color-neutral-500)' }}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
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
            <label htmlFor="novo-nome">Descrição</label>
            <input
              className="input"
              id="novo-nome"
              type="text"
              placeholder="Ex.: Geladeira nova"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="field-kicker" style={{ paddingBottom: 8 }}>Categoria</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DEBT_CATEGORY_OPTIONS.map((c) => (
                <button key={c.value} onClick={() => setForm((f) => ({ ...f, categoria: c.value }))} className={pillClass(form.categoria === c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'grid', gap: 6, marginTop: 20 }}>
            {TIPO_OPTIONS.filter((o) => !o.hidden).map((o) => (
              <button
                key={o.v}
                onClick={() => setForm((f) => ({ ...f, tipo: o.v }))}
                className="card"
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: '11px 12px',
                  borderColor: form.tipo === o.v ? 'var(--color-accent-600)' : undefined,
                  boxShadow: form.tipo === o.v ? 'inset 0 0 0 1px var(--color-accent-600)' : 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 500, color: form.tipo === o.v ? 'var(--color-accent-200)' : 'var(--color-text)' }}>{o.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 3 }}>{o.desc}</div>
              </button>
            ))}
          </div>

          {form.tipo === 'parcelado' && (
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }} className="card">
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>Parcelas</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2 }}>Total {money(valorNum * nParc, false)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-secondary btn-icon" onClick={() => setForm((f) => ({ ...f, n: String(Math.max(2, nParc - 1)) }))} aria-label="Menos uma parcela" style={{ width: 30, height: 30 }}>
                  <i className="ph ph-minus" />
                </button>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 500, minWidth: 26, textAlign: 'center' }}>{nParc}</div>
                <button className="btn btn-secondary btn-icon" onClick={() => setForm((f) => ({ ...f, n: String(Math.min(48, nParc + 1)) }))} aria-label="Mais uma parcela" style={{ width: 30, height: 30 }}>
                  <i className="ph ph-plus" />
                </button>
              </div>
            </div>
          )}

          {form.tipo === 'avulso' && (
            <div style={{ marginTop: 16 }}>
              <div className="field-kicker" style={{ paddingBottom: 8 }}>Tipo de despesa</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={pillClass(form.expenseType === schemas.ExpenseType.enum.FIXED)}
                  onClick={() => setForm((f) => ({ ...f, expenseType: schemas.ExpenseType.enum.FIXED }))}
                >
                  Fixa pontual
                </button>
                <button
                  className={pillClass(form.expenseType === schemas.ExpenseType.enum.VARIABLE)}
                  onClick={() => setForm((f) => ({ ...f, expenseType: schemas.ExpenseType.enum.VARIABLE }))}
                >
                  Variável
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }} className="card">
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{form.tipo === 'parcelado' ? 'Mês de início' : 'Mês'}</div>
              {form.tipo === 'parcelado' && (
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2 }}>Última em {endLabel}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-secondary btn-icon" onClick={() => setStartOffset((o) => o - 1)} aria-label="Mês anterior" style={{ width: 30, height: 30 }}>
                <i className="ph ph-caret-left" />
              </button>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 500, minWidth: 64, textAlign: 'center' }}>{startLabel}</div>
              <button className="btn btn-secondary btn-icon" onClick={() => setStartOffset((o) => o + 1)} aria-label="Próximo mês" style={{ width: 30, height: 30 }}>
                <i className="ph ph-caret-right" />
              </button>
            </div>
          </div>

          <div className="field" style={{ marginTop: 16, maxWidth: 120 }}>
            <label htmlFor="novo-dia">Dia do mês</label>
            <input className="input" id="novo-dia" type="number" min={1} max={28} value={form.dia} onChange={(e) => setForm((f) => ({ ...f, dia: e.target.value }))} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ marginTop: 20, display: 'grid', gap: 9 }}>
            {[
              { k: 'Descrição', v: form.nome.trim() || '(sem nome)' },
              { k: 'Tipo', v: TIPO_OPTIONS.find((t) => t.v === form.tipo)?.label ?? form.tipo },
              { k: form.tipo === 'parcelado' ? 'Parcela' : 'Valor', v: money(valorNum, false) + (form.tipo === 'parcelado' ? ` × ${nParc}` : '') },
              { k: 'Categoria', v: DEBT_CATEGORY_OPTIONS.find((c) => c.value === form.categoria)?.label ?? form.categoria },
              { k: form.tipo === 'parcelado' ? '1º vencimento' : 'Vencimento', v: due.format('DD/MM/YYYY') },
              { k: form.tipo === 'parcelado' ? 'Total' : 'No ano', v: money(valorNum * (form.tipo === 'parcelado' ? nParc : 12), false) },
            ].map((r) => (
              <div key={r.k} className="kv-row">
                <span className="kv-row-label">{r.k}</span>
                <span className="kv-row-value">{r.v}</span>
              </div>
            ))}
          </div>

          {impacto && (
            <div style={{ marginTop: 18, padding: '13px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-900)', border: '1px solid var(--color-accent-700)' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent-300)' }}>O que muda</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-accent-200)', marginTop: 6 }}>{impacto}</div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>
          )}
        </div>
      )}

      <button
        className="btn btn-primary btn-block"
        onClick={handleAvancar}
        disabled={isPending || (step === 1 && !valorNum)}
        style={{ marginTop: 24, justifyContent: 'center' }}
      >
        {isPending ? 'Criando…' : step === 3 ? (form.tipo === 'parcelado' ? `Criar ${nParc} lançamentos` : 'Criar despesa') : 'Continuar'}
      </button>
    </div>
  );
}
