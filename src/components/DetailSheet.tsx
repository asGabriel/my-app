import { useState } from 'react';
import dayjs from 'dayjs';
import { useFinancePayments, useRefundFinancePayment } from '../api';
import { useFinanceMonth } from '../finance/FinanceMonthContext';
import { money } from '../finance/format';
import { categoryIcon } from '../finance/categoryIcon';
import { KIND_LABELS } from '../finance/monthEngine';
import { DEBT_CATEGORY_LABELS, type DebtCategory } from '../utils/constants';

export function DetailSheet() {
  const { detail, closeDetail, privado, debtsById, openPay, getOccurrences } = useFinanceMonth();
  const refund = useRefundFinancePayment();
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  // `detail.occurrence` é um retrato de quando o sheet abriu — relê do mês
  // para refletir pagamento/estorno feitos com ele aberto.
  const o = detail
    ? getOccurrences(detail.year, detail.month0).find((x) => x.key === detail.occurrence.key) ?? detail.occurrence
    : undefined;
  const { data: payments } = useFinancePayments(
    { debtIds: o?.debtId ? [o.debtId] : [] },
    !!o?.debtId && o.paidAmount > 0.005
  );

  if (!detail || !o) return null;
  const { year, month0 } = detail;

  const handleRefund = async (paymentId: string) => {
    setRefundError(null);
    try {
      await refund.mutateAsync({ paymentId });
      setConfirmRefundId(null);
    } catch (e) {
      setRefundError(e instanceof Error ? e.message : 'Erro ao estornar pagamento');
    }
  };

  const close = () => {
    setConfirmRefundId(null);
    setRefundError(null);
    closeDetail();
  };
  // `debtId` é a dívida-filha (parcela) quando parcelado — ela já carrega sua
  // própria data e valor. Só o pai sabe o total ainda em aberto do
  // parcelamento inteiro.
  const debt = o.debtId ? debtsById.get(o.debtId) : undefined;
  const parent = debt?.parentId ? debtsById.get(debt.parentId) : undefined;
  const installmentCount = parent?.installmentCount ?? debt?.installmentCount;
  const lastDue =
    debt?.dueDate && installmentCount && debt.installmentNumber
      ? dayjs(debt.dueDate).add(installmentCount - debt.installmentNumber, 'month')
      : null;

  const rows: { k: string; v: string }[] = [
    { k: 'Tipo', v: KIND_LABELS[o.kind].replace(/^./, (c) => c.toUpperCase()) },
    { k: 'Categoria', v: DEBT_CATEGORY_LABELS[o.category as DebtCategory] ?? o.category },
    { k: 'Vencimento', v: `Dia ${o.dueDay}` },
  ];
  if (o.kind === 'parcelado' && o.installmentId) {
    rows.push({ k: 'Parcela', v: `${o.installmentId} de ${o.installmentCount}` });
    if (lastDue) rows.push({ k: 'Última', v: lastDue.format('MMM/YY') });
    if (parent) rows.push({ k: 'Falta pagar (total)', v: money(parseFloat(parent.remainingAmount), privado) });
  } else if (o.kind === 'variavel') {
    rows.push({ k: 'Geração', v: 'Lançamento avulso deste mês, categorizado como variável' });
  } else if (o.kind === 'fixo') {
    rows.push({ k: 'No ano', v: money(o.amount * 12, privado) });
    rows.push({ k: 'Geração', v: o.projected ? 'Recorrência ativa — ainda não gerada este mês' : 'Gerado automaticamente' });
  }

  const parcial = !o.isPaid && o.paidAmount > 0.01;
  rows.push({
    k: 'Status',
    v: o.isPaid ? 'Pago' : parcial ? `Pago parcialmente · falta ${money(o.amount - o.paidAmount, privado)}` : 'Em aberto',
  });

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="avatar-icon" style={{ width: 40, height: 40, fontSize: 19 }}>
            <i className={categoryIcon(o.category)} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 17 }}>{o.name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 2 }}>
              {KIND_LABELS[o.kind]}
              {o.installmentId ? ` · ${o.installmentId}/${o.installmentCount}` : ''}
            </div>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 30, letterSpacing: '-0.03em', marginTop: 16 }}>
          {money(o.amount, privado)}
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.k} className="kv-row">
              <span className="kv-row-label">{r.k}</span>
              <span className="kv-row-value">{r.v}</span>
            </div>
          ))}
        </div>

        {o.projected && (
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-neutral-500)', lineHeight: 1.5 }}>
            Esta é uma projeção da recorrência — ela ainda não virou um lançamento real neste mês, então não dá para pagar por aqui.
          </div>
        )}

        {o.paidAmount > 0.005 && payments && payments.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="field-kicker" style={{ paddingBottom: 8 }}>Pagamentos</div>
            <div style={{ display: 'grid', gap: 9 }}>
              {payments.map((p) => (
                <div key={p.id} className="kv-row" style={{ alignItems: 'center' }}>
                  <span className="kv-row-label">{dayjs(p.paymentDate).format('DD/MM/YYYY')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="kv-row-value">{money(parseFloat(p.amount), privado)}</span>
                    {confirmRefundId === p.id ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRefund(p.id)}
                        disabled={refund.isPending}
                        style={{ padding: '3px 9px', fontSize: 11, borderRadius: 999 }}
                      >
                        {refund.isPending ? 'Estornando…' : 'Confirmar estorno'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => { setRefundError(null); setConfirmRefundId(p.id); }}
                        style={{ padding: '3px 9px', fontSize: 11, borderRadius: 999 }}
                      >
                        Estornar
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {refundError && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-accent-300)' }}>{refundError}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {!o.isPaid && o.debtId && o.payable && (
            <button
              className="btn btn-primary"
              onClick={() => {
                close();
                openPay(o, year, month0);
              }}
              style={{ flex: '1 1 auto', justifyContent: 'center' }}
            >
              {parcial ? 'Concluir pagamento' : `Pagar ${money(o.amount - o.paidAmount, privado)}`}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={close}
            style={{ flex: o.isPaid || !o.debtId || !o.payable ? '1 1 auto' : '0 0 auto' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
