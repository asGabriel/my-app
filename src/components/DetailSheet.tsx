import dayjs from 'dayjs';
import { useFinanceMonth } from '../finance/FinanceMonthContext';
import { money } from '../finance/format';
import { categoryIcon } from '../finance/categoryIcon';
import { KIND_LABELS } from '../finance/monthEngine';
import { DEBT_CATEGORY_LABELS, type DebtCategory } from '../utils/constants';

export function DetailSheet() {
  const { detail, closeDetail, privado, debtsById, openPay } = useFinanceMonth();

  if (!detail) return null;
  const { occurrence: o, year, month0 } = detail;
  const debt = o.debtId ? debtsById.get(o.debtId) : undefined;

  const rows: { k: string; v: string }[] = [
    { k: 'Tipo', v: KIND_LABELS[o.kind].replace(/^./, (c) => c.toUpperCase()) },
    { k: 'Categoria', v: DEBT_CATEGORY_LABELS[o.category as DebtCategory] ?? o.category },
    { k: 'Vencimento', v: `Dia ${o.dueDay}` },
  ];
  if (o.kind === 'parcelado' && o.installmentId && debt) {
    rows.push({ k: 'Parcela', v: `${o.installmentId} de ${o.installmentCount}` });
    rows.push({ k: 'Última', v: dayjs(debt.dueDate).format('MMM/YY') });
    rows.push({ k: 'Falta pagar (total)', v: money(parseFloat(debt.remainingAmount), privado) });
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
    <div className="sheet-backdrop" onClick={closeDetail}>
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

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {!o.isPaid && o.debtId && (
            <button
              className="btn btn-primary"
              onClick={() => {
                closeDetail();
                openPay(o, year, month0);
              }}
              style={{ flex: '1 1 auto', justifyContent: 'center' }}
            >
              {parcial ? 'Concluir pagamento' : `Pagar ${money(o.amount - o.paidAmount, privado)}`}
            </button>
          )}
          <button className="btn btn-secondary" onClick={closeDetail} style={{ flex: o.isPaid || !o.debtId ? '1 1 auto' : '0 0 auto' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
