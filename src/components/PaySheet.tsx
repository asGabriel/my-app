import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useCreatePayment, type CreatePaymentRequest } from '../finance/mock';
import { useFinanceMonth } from '../finance/FinanceMonthContext';
import { money, short } from '../finance/format';
import { categoryIcon } from '../finance/categoryIcon';

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

export function PaySheet() {
  const { pay, closePay, privado, debtsById, financialInstruments } = useFinanceMonth();
  const createPayment = useCreatePayment();

  const debt = pay?.occurrence.debtId ? debtsById.get(pay.occurrence.debtId) : undefined;
  const falta = pay ? Math.max(0, pay.occurrence.amount - pay.occurrence.paidAmount) : 0;

  const [valueRaw, setValueRaw] = useState('');
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [day, setDay] = useState<number>(dayjs().date());
  const [done, setDone] = useState<{ amount: number; day: number; src: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pay) {
      setValueRaw(falta.toFixed(2).replace('.', ','));
      setSrc(financialInstruments[0]?.id);
      setDay(dayjs().date());
      setDone(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay?.occurrence.key]);

  if (!pay) return null;

  const value = parseFloat(valueRaw.replace(',', '.')) || 0;
  const resto = Math.max(0, falta - value);
  const canConfirm = value > 0.005 && !!src && !!debt;

  const handleConfirm = async () => {
    if (!debt || !src) return;
    setError(null);
    try {
      const payload: CreatePaymentRequest = {
        debtId: debt.id,
        financialInstrumentId: src,
        paymentDate: dayjs(new Date(pay.year, pay.month0, day)).format('YYYY-MM-DD'),
        amount: value.toString(),
        reconcile: false,
      };
      await createPayment.mutateAsync(payload);
      setDone({ amount: value, day, src });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao registrar pagamento');
    }
  };

  const srcLabel = (id?: string) => financialInstruments.find((i) => i.id === id)?.name ?? '—';

  return (
    <div className="sheet-backdrop" onClick={closePay}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />

        {!done ? (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="avatar-icon" style={{ width: 40, height: 40, fontSize: 19 }}>
                <i className={categoryIcon(pay.occurrence.category)} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{pay.occurrence.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2 }}>
                  {pay.occurrence.installmentId ? `parcela ${pay.occurrence.installmentId}/${pay.occurrence.installmentCount}` : 'despesa'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="field-kicker">Quanto você vai pagar</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, borderBottom: '1px solid var(--color-accent-700)', paddingBottom: 8 }}>
                <span style={{ fontSize: 19, color: 'var(--color-neutral-500)' }}>R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueRaw}
                  onChange={(e) => setValueRaw(e.target.value)}
                  style={{ flex: '1 1 auto', minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--color-text)', fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 34, letterSpacing: '-0.03em' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className={pillClass(Math.abs(value - falta) < 0.01)} onClick={() => setValueRaw(falta.toFixed(2).replace('.', ','))}>
                  Tudo · {short(falta, privado)}
                </button>
                <button className={pillClass(Math.abs(value - falta / 2) < 0.01)} onClick={() => setValueRaw((falta / 2).toFixed(2).replace('.', ','))}>
                  Metade · {short(falta / 2, privado)}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 9 }}>
                Em aberto: {money(falta, privado)}
                {pay.occurrence.paidAmount > 0.01 ? ` · já pagos ${money(pay.occurrence.paidAmount, privado)}.` : '.'}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="field-kicker" style={{ paddingBottom: 8 }}>Sai de onde</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {financialInstruments.length === 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--color-neutral-500)' }}>
                    Cadastre um instrumento financeiro em Cadastros para poder registrar pagamentos.
                  </div>
                )}
                {financialInstruments.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setSrc(inst.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)', padding: '10px 12px',
                      fontFamily: 'var(--font-body)', textAlign: 'left', cursor: 'pointer',
                      border: `1px solid ${src === inst.id ? 'var(--color-accent-600)' : 'var(--color-divider)'}`,
                      background: src === inst.id ? 'var(--color-accent-900)' : 'transparent',
                    }}
                  >
                    <i className="ph ph-bank" style={{ fontSize: 17, color: 'var(--color-accent-300)' }} />
                    <span style={{ flex: '1 1 auto', fontSize: 13, color: src === inst.id ? 'var(--color-accent-200)' : 'var(--color-text)' }}>{inst.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>{inst.identification}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18, padding: '13px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-900)', border: '1px solid var(--color-accent-700)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-accent-200)' }}>
              {resto > 0.01
                ? `${money(resto, privado)} fica em aberto e continua na lista deste mês.`
                : 'Isso quita a despesa.'}
            </div>

            {error && <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{error}</div>}

            <button className="btn btn-primary btn-block" onClick={handleConfirm} disabled={!canConfirm || createPayment.isPending} style={{ marginTop: 18, justifyContent: 'center' }}>
              {createPayment.isPending ? 'Confirmando…' : `Confirmar ${money(value, privado)}`}
            </button>
            <button className="btn btn-secondary btn-block" onClick={closePay} style={{ marginTop: 8, justifyContent: 'center' }}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <div
              className="avatar-icon"
              style={{ width: 52, height: 52, fontSize: 26, margin: '10px auto 0', background: 'var(--color-accent-900)', border: '1px solid var(--color-accent-600)' }}
            >
              <i className="ph ph-check" />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 30, letterSpacing: '-0.03em', marginTop: 18, textAlign: 'center' }}>
              {money(done.amount, privado)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 6, textAlign: 'center' }}>Pagamento registrado</div>
            <div style={{ marginTop: 20, display: 'grid', gap: 9 }}>
              {[
                { k: 'Despesa', v: pay.occurrence.name },
                { k: 'Pago em', v: dayjs(new Date(pay.year, pay.month0, done.day)).format('DD/MM/YYYY') },
                { k: 'Origem', v: srcLabel(done.src) },
                { k: 'Situação', v: resto > 0.01 ? `Parcial · falta ${money(resto, privado)}` : 'Quitado' },
              ].map((r) => (
                <div key={r.k} className="kv-row">
                  <span className="kv-row-label">{r.k}</span>
                  <span className="kv-row-value">{r.v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={closePay} style={{ marginTop: 20, justifyContent: 'center' }}>
              Voltar ao mês
            </button>
          </>
        )}
      </div>
    </div>
  );
}
