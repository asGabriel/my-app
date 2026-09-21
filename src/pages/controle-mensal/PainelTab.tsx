import dayjs from 'dayjs';
import { useFinanceMonth, MESES_CURTOS, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { short } from '../../finance/format';
import { computeCategoryBreakdown, computeMix, type OccKind } from '../../finance/monthEngine';
import { DEBT_CATEGORY_LABELS, type DebtCategory } from '../../utils/constants';

const MIX_COLOR: Record<OccKind, string> = {
  fixo: 'var(--color-accent-600)',
  variavel: 'var(--color-accent-400)',
  parcelado: 'var(--color-accent-300)',
};

const N_PROJECTION = 6;
const N_TREND = 6;

export function PainelTab() {
  const { selected, getOccurrences, getTotals, privado } = useFinanceMonth();
  const { year, month0 } = selected;
  const selectedMoment = dayjs(new Date(year, month0, 1));

  const occurrences = getOccurrences(year, month0);
  const totals = getTotals(year, month0);
  const mix = computeMix(totals);
  const cats = computeCategoryBreakdown(occurrences).slice(0, 6);

  let acc = 0;
  const donut = mix.length
    ? `conic-gradient(${mix
        .map((m) => {
          const a = acc;
          const b = acc + (totals.total > 0 ? (m.amount / totals.total) * 360 : 0);
          acc = b;
          return `${MIX_COLOR[m.kind]} ${a.toFixed(1)}deg ${b.toFixed(1)}deg`;
        })
        .join(', ')})`
    : 'var(--color-neutral-900)';

  // Nota: computados direto no corpo do componente (sem useMemo) — o volume
  // de dados de um app financeiro pessoal é pequeno, e memoizar aqui exigiria
  // depender de `getTotals`/`getOccurrences` (novas closures a cada render do
  // provider), o que reintroduziria os mesmos valores obsoletos que a memo
  // evitaria recalcular.
  const trend = [];
  for (let i = N_TREND - 1; i >= 0; i--) {
    const m = selectedMoment.subtract(i, 'month');
    const t = getTotals(m.year(), m.month());
    trend.push({ label: MESES_CURTOS[m.month()], value: t.variaveis, current: i === 0 });
  }
  const maxTrend = Math.max(1, ...trend.map((r) => r.value));
  const trendBars = trend.map((r) => ({ ...r, h: Math.max(6, Math.round((r.value / maxTrend) * 100)) }));

  const avgPrevious = trend.slice(0, -1).reduce((s, t) => s + t.value, 0) / Math.max(1, trend.length - 1);
  const varDelta = avgPrevious > 0 ? Math.round((trend[trend.length - 1].value / avgPrevious - 1) * 100) : 0;

  const projection = [];
  for (let i = 0; i < N_PROJECTION; i++) {
    const m = selectedMoment.add(i, 'month');
    const occ = getOccurrences(m.year(), m.month());
    const t = getTotals(m.year(), m.month());
    const ending = occ.filter((o) => o.installmentId && o.installmentCount && o.installmentId === o.installmentCount);
    projection.push({
      label: `${MESES_LONGOS[m.month()].replace(/^./, (c) => c.toUpperCase())} ${String(m.year()).slice(2)}${i === 0 ? ' · atual' : ''}`,
      current: i === 0,
      total: t.total,
      saldo: t.livre,
      note: ending.length ? `Última parcela: ${ending.map((o) => o.name).join(', ')}` : `${t.nParc} parcelas ativas`,
    });
  }

  return (
    <div>
      <div style={{ padding: '8px 0 0' }}>
        <div className="section-kicker">Painel de {MESES_LONGOS[month0]} de {year}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.3 }}>
          Para onde o mês foi
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto', width: 124, height: 124, borderRadius: 999, background: donut, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 999, background: 'var(--color-bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{short(totals.total, privado)}</div>
              <div style={{ fontSize: 10, color: 'var(--color-neutral-500)', marginTop: 1 }}>no mês</div>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 180px', display: 'grid', gap: 7 }}>
          {mix.map((m) => (
            <div key={m.kind} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: MIX_COLOR[m.kind], flex: '0 0 auto' }} />
              <span style={{ flex: '1 1 auto', color: 'var(--color-neutral-400)' }}>{m.label}</span>
              <span style={{ fontWeight: 500 }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="section-kicker">Por categoria</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 11 }}>
          {cats.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>Nenhum lançamento neste mês.</div>
          )}
          {cats.map((c) => (
            <div key={c.category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span>{DEBT_CATEGORY_LABELS[c.category as DebtCategory] ?? c.category}</span>
                <span style={{ color: 'var(--color-neutral-400)' }}>{short(c.amount, privado)}</span>
              </div>
              <div style={{ marginTop: 5, height: 5, borderRadius: 999, background: 'var(--color-neutral-900)', overflow: 'hidden' }}>
                <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--color-accent-500)', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="section-kicker">Gastos variáveis · {N_TREND} meses</div>
        <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 7, lineHeight: 1.5 }}>
          {avgPrevious > 0
            ? (varDelta >= 0
                ? `Este mês está ${varDelta}% acima da média dos ${N_TREND - 1} anteriores.`
                : `Este mês está ${-varDelta}% abaixo da média dos ${N_TREND - 1} anteriores.`)
            : 'Histórico insuficiente para comparação.'}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96, marginTop: 14 }}>
          {trendBars.map((t, i) => (
            <div key={i} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 10, color: 'var(--color-neutral-400)' }}>{privado ? '•' : `${Math.round(t.value / 100) / 10}k`}</div>
              <div style={{ width: '100%', height: `${t.h}%`, background: t.current ? 'var(--color-accent-400)' : 'var(--color-accent-700)', borderRadius: '4px 4px 0 0' }} />
              <div style={{ fontSize: 10, color: 'var(--color-neutral-500)' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="section-kicker">Próximos meses</div>
        {projection.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              padding: '11px 0', borderBottom: '1px solid var(--color-divider)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: p.current ? 'var(--color-accent-200)' : 'var(--color-text)' }}>{p.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2 }}>{p.note}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{short(p.total, privado)}</div>
              <div style={{ fontSize: 11, color: p.saldo < 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-500)', marginTop: 2 }}>
                livre {short(p.saldo, privado)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
