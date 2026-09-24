import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useFinanceDebtParents, useFinanceDebts } from '../../api';
import { debtAmounts, installmentCountOf, isInstallment, isSettled, lastInstallmentDueDate } from '../../finance/debt';
import { useFinanceMonth, MESES_CURTOS, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';

const monthIdx = (d: dayjs.Dayjs) => d.year() * 12 + d.month();

export function ParcelasTab() {
  const { selected, getTotals, privado } = useFinanceMonth();
  const { year, month0 } = selected;

  // Parcelas (filhas) que vencem no mês selecionado. Com filtro de data o
  // backend não devolve o pai (sem due_date), então ele vem numa 2ª request.
  const monthFilters = useMemo(() => {
    const first = dayjs(new Date(year, month0, 1));
    return {
      includeChildren: true,
      startDate: first.format('YYYY-MM-DD'),
      endDate: first.endOf('month').format('YYYY-MM-DD'),
    };
  }, [year, month0]);
  const { data, isLoading, isError, error, refetch } = useFinanceDebts(monthFilters);
  const parcelas = useMemo(() => (data ?? []).filter(isInstallment), [data]);

  const { parentIds, parentsById } = useFinanceDebtParents(parcelas);

  // A renda ainda vem do mock (não existe no módulo `finance`).
  const renda = getTotals(year, month0).renda;
  const totalParcelas = parcelas.reduce((sum, d) => sum + debtAmounts(d).total, 0);
  const pctRenda = renda > 0 ? Math.round((totalParcelas / renda) * 100) : 0;

  const restanteTotal = Array.from(parentsById.values()).reduce((sum, p) => sum + debtAmounts(p).remaining, 0);

  const label = (m: dayjs.Dayjs) => `${MESES_CURTOS[m.month()]}/${String(m.year()).slice(2)}`;

  const cards = parcelas.map((d) => {
    const parent = parentsById.get(d.parentId!);
    const count = installmentCountOf(d, parent) ?? null;
    const last = lastInstallmentDueDate(d, parent);
    return {
      debt: d,
      count,
      pct: count && d.installmentNumber ? Math.round((d.installmentNumber / count) * 100) : 0,
      restante: parent ? debtAmounts(parent).remaining : null,
      lastLabel: last ? label(last) : '—',
      last,
    };
  });

  const lastOverall = cards.reduce<dayjs.Dayjs | null>(
    (max, c) => (c.last && (!max || monthIdx(c.last) > monthIdx(max)) ? c.last : max),
    null
  );
  const zeraEm = lastOverall ? label(lastOverall) : '—';

  return (
    <div>
      <div style={{ padding: '8px 0 0' }}>
        <div className="section-kicker">Saúde das parcelas</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 34, letterSpacing: '-0.03em', marginTop: 6 }}>
          {pctRenda}% da renda
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 7, lineHeight: 1.5 }}>
          {pctRenda > 30
            ? 'Passou do ponto confortável. Cada parcelado novo empurra a data em que você volta a respirar.'
            : 'Dentro do confortável. A régua mais usada é não passar de 30% da renda em parcelas.'}
        </div>
      </div>

      <div style={{ marginTop: 16, height: 8, borderRadius: 999, background: 'var(--color-neutral-900)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, pctRenda)}%`, height: '100%', borderRadius: 999,
            background: pctRenda > 30 ? 'var(--color-accent-300)' : 'var(--color-accent-500)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--color-neutral-500)' }}>
        <span>{money(totalParcelas, privado)} por mês</span>
        <span>limite saudável 30%</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 18 }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="card-kicker">Falta pagar</div>
          <div style={{ fontSize: 17, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{short(restanteTotal, privado)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>em {parentIds.length} compromissos</div>
        </div>
        <div className="card" style={{ padding: 12 }}>
          <div className="card-kicker">Fica livre em</div>
          <div style={{ fontSize: 17, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{zeraEm}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>se nada novo entrar</div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>Carregando…</div>
      ) : isError ? (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
            {error instanceof Error ? error.message : 'Erro ao carregar as parcelas.'}
          </div>
          <button className="btn btn-secondary" onClick={() => refetch()} style={{ marginTop: 12 }}>Tentar de novo</button>
        </div>
      ) : cards.length === 0 ? (
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>
          Nenhuma parcela em {MESES_LONGOS[month0]}.
        </div>
      ) : (
        cards.map(({ debt, count, pct, restante, lastLabel }) => (
          <div
            key={debt.id}
            className="card"
            style={{ marginTop: 10, padding: '13px 14px', opacity: isSettled(debt) ? 0.55 : 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{debt.description}</div>
              <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{money(debtAmounts(debt).total, privado)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 7 }}>
              <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)' }}>
                Parcela {debt.installmentNumber} de {count ?? '?'} · última em {lastLabel}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-accent-300)' }}>{restante != null && `falta ${short(restante, privado)}`}</div>
            </div>
            <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: 'var(--color-neutral-800)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent-500)', borderRadius: 999 }} />
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--color-neutral-500)', lineHeight: 1.5 }}>
        Um parcelado só entra aqui quando tem fim conhecido. Recorrentes sem data de término ficam no Painel, como custo fixo.
      </div>
    </div>
  );
}
