import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { HorizontalScroller } from '../../components/HorizontalScroller';
import { debtAmounts, installmentCountOf, isInstallment, isSettled, lastInstallmentDueDate, parentOf } from '../../finance/debt';
import { useFinanceMonth, MESES_CURTOS, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { monthIndex } from '../../finance/monthEngine';

/** Meses antes do atual no gráfico — os mesmos que os chips de mês mostram. */
const CHART_MONTHS_BACK = 3;
/** O gráfico vai até o último mês com parcela, mas nunca menos que isto à frente. */
const CHART_MIN_MONTHS_FORWARD = 5;
/** Teto à frente — a janela que o `FinanceMonthContext` busca. */
const CHART_MAX_MONTHS_FORWARD = 12;
const BAR_AREA_HEIGHT = 110;

const label = (m: dayjs.Dayjs) => `${MESES_CURTOS[m.month()]}/${String(m.year()).slice(2)}`;

export function ParcelasTab() {
  const { selected, getOccurrences, getTotals, debtsById, privado, isLoading, isError, error, refetch } = useFinanceMonth();
  const today = useMemo(() => dayjs().startOf('month'), []);

  // Mês da lista. Começa no mês selecionado nos chips das outras abas; depois
  // segue o clique nas barras.
  const [sel, setSel] = useState(selected);

  // Nota: sem useMemo, como no PainelTab — `getOccurrences`/`getTotals` são
  // closures novas a cada render do provider.
  const allBars = Array.from({ length: CHART_MONTHS_BACK + CHART_MAX_MONTHS_FORWARD + 1 }, (_, k) => {
    const i = k - CHART_MONTHS_BACK;
    const m = today.add(i, 'month');
    const parc = getOccurrences(m.year(), m.month()).filter((o) => o.kind === 'parcelado');
    return {
      year: m.year(),
      month0: m.month(),
      label: MESES_CURTOS[m.month()] + (m.month() === 0 || k === 0 ? ` ${String(m.year()).slice(2)}` : ''),
      value: parc.reduce((s, o) => s + o.amount, 0),
      count: parc.length,
      past: i < 0,
      current: i === 0,
    };
  });
  const lastWithParc = allBars.reduce((last, b, i) => (b.count > 0 ? i : last), -1);
  const bars = allBars.slice(0, Math.max(lastWithParc, CHART_MONTHS_BACK + CHART_MIN_MONTHS_FORWARD) + 1);
  const maxBar = Math.max(1, ...bars.map((b) => b.value));
  const selIdx = bars.findIndex((b) => b.year === sel.year && b.month0 === sel.month0);

  // Parcelas (filhas) que vencem no mês escolhido. O contexto já tem a janela
  // inteira com filhas e pais (`debtsById`), então não precisa de request própria.
  const parcelas = Array.from(debtsById.values())
    .filter((d) => isInstallment(d) && d.dueDate)
    .filter((d) => {
      const due = dayjs(d.dueDate);
      return due.year() === sel.year && due.month() === sel.month0;
    })
    .sort((a, b) => dayjs(a.dueDate).date() - dayjs(b.dueDate).date());

  const renda = getTotals(sel.year, sel.month0).renda;
  const totalParcelas = parcelas.reduce((sum, d) => sum + debtAmounts(d).total, 0);
  const pctRenda = renda > 0 ? Math.round((totalParcelas / renda) * 100) : 0;

  // Compromissos ainda em aberto (de hoje em diante, não do mês escolhido):
  // pais com saldo, e quando cai a última parcela de cada um.
  const lastByParent = new Map<string, dayjs.Dayjs>();
  debtsById.forEach((d) => {
    const parent = parentOf(d, debtsById);
    if (!parent || debtAmounts(parent).remaining <= 0 || lastByParent.has(parent.id)) return;
    const last = lastInstallmentDueDate(d, parent);
    if (last) lastByParent.set(parent.id, last);
  });
  const activeParents = Array.from(lastByParent.keys()).map((id) => debtsById.get(id)!);
  const restanteTotal = activeParents.reduce((sum, p) => sum + debtAmounts(p).remaining, 0);
  const lastOverall = Array.from(lastByParent.values()).reduce<dayjs.Dayjs | null>(
    (max, l) => (!max || monthIndex(l.year(), l.month()) > monthIndex(max.year(), max.month()) ? l : max),
    null
  );
  const zeraEm = lastOverall ? label(lastOverall) : '—';

  const cards = parcelas.map((d) => {
    const parent = parentOf(d, debtsById);
    const count = installmentCountOf(d, parent) ?? null;
    const last = lastInstallmentDueDate(d, parent);
    return {
      debt: d,
      count,
      pct: count && d.installmentNumber ? Math.round((d.installmentNumber / count) * 100) : 0,
      restante: parent ? debtAmounts(parent).remaining : null,
      lastLabel: last ? label(last) : '—',
    };
  });

  return (
    <div>
      <div style={{ padding: '8px 0 0' }}>
        <div className="section-kicker">Parcelas mês a mês</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.3 }}>
          {lastOverall ? `Livre de parcelas em ${MESES_LONGOS[lastOverall.month()]} de ${lastOverall.year()}` : 'Nenhum parcelado em aberto'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="card-kicker">Falta pagar</div>
          <div style={{ fontSize: 17, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{short(restanteTotal, privado)}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>em {activeParents.length} compromissos</div>
        </div>
        <div className="card" style={{ padding: 12 }}>
          <div className="card-kicker">Fica livre em</div>
          <div style={{ fontSize: 17, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{zeraEm}</div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>se nada novo entrar</div>
        </div>
      </div>

      <HorizontalScroller activeIndex={selIdx >= 0 ? selIdx : undefined} gap={6} ariaLabel="Parcelas por mês" style={{ marginTop: 22 }}>
        {bars.map((b) => {
          const active = b.year === sel.year && b.month0 === sel.month0;
          const h = b.value > 0 ? Math.max(6, Math.round((b.value / maxBar) * 100)) : 0;
          return (
            <button
              key={`${b.year}-${b.month0}`}
              type="button"
              onClick={() => setSel({ year: b.year, month0: b.month0 })}
              aria-pressed={active}
              aria-label={`${MESES_LONGOS[b.month0]} de ${b.year}: ${privado ? 'valor oculto' : short(b.value, false)}, ${b.count} parcelas`}
              style={{
                width: 40, padding: '6px 0 4px', border: 0, borderRadius: 8, cursor: 'pointer', font: 'inherit',
                background: active ? 'var(--color-accent-900)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              }}
            >
              <div style={{ fontSize: 10, color: active ? 'var(--color-accent-200)' : 'var(--color-neutral-400)', height: 12 }}>
                {b.value > 0 && (privado ? '•' : `${Math.round(b.value / 100) / 10}k`)}
              </div>
              <div style={{ width: 22, height: BAR_AREA_HEIGHT, display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: h ? `${h}%` : 2,
                    borderRadius: h ? '4px 4px 0 0' : 1,
                    background: !h
                      ? 'var(--color-neutral-800)'
                      : active
                        ? 'var(--color-accent-400)'
                        : b.past
                          ? 'var(--color-accent-800)'
                          : 'var(--color-accent-700)',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: b.current ? 600 : 400,
                  color: active ? 'var(--color-accent-200)' : b.current ? 'var(--color-text)' : 'var(--color-neutral-500)',
                }}
              >
                {b.label}
              </div>
            </button>
          );
        })}
      </HorizontalScroller>

      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <div className="section-kicker">
          {MESES_LONGOS[sel.month0]} de {sel.year}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{money(totalParcelas, privado)}</div>
      </div>
      {renda > 0 && (
        <>
          <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'var(--color-neutral-900)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, pctRenda)}%`, height: '100%', borderRadius: 999,
                background: pctRenda > 30 ? 'var(--color-accent-300)' : 'var(--color-accent-500)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--color-neutral-500)' }}>
            <span style={{ color: pctRenda > 30 ? 'var(--color-accent-300)' : undefined }}>{pctRenda}% da renda do mês</span>
            <span>limite saudável 30%</span>
          </div>
        </>
      )}

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
          Nenhuma parcela em {MESES_LONGOS[sel.month0]}.
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
                Dia {dayjs(debt.dueDate).date()} · parcela {debt.installmentNumber} de {count ?? '?'} · última em {lastLabel}
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
