import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useFinanceMonth, MESES_CURTOS, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { compact, money, short } from '../../finance/format';
import { categoryIcon } from '../../finance/categoryIcon';
import { debtsPathForCategory } from '../../finance/debt';
import { computeCategoryBreakdown, computeMix, MIX_LABELS, type OccKind } from '../../finance/monthEngine';
import { DEBT_CATEGORY_LABELS } from '../../utils/constants';
import { MonthChips } from './MonthChips';

const MIX_COLOR: Record<OccKind, string> = {
  fixo: 'var(--color-accent-600)',
  variavel: 'var(--color-accent-400)',
  parcelado: 'var(--color-accent-300)',
};

/** Ordem de empilhamento das barras de tendência (de baixo para cima). */
const KIND_ORDER: OccKind[] = ['fixo', 'parcelado', 'variavel'];

const N_PROJECTION = 6;
const N_TREND = 6;

const ROW_BUTTON_STYLE = {
  display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent',
  cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left',
} as const;

export function PainelTab() {
  const { selected, getOccurrences, getTotals, privado, togglePrivado, openDetail, isLoading, isError, error, refetch } =
    useFinanceMonth();
  const navigate = useNavigate();
  const { year, month0 } = selected;
  const selectedMoment = dayjs(new Date(year, month0, 1));
  // Categoria aberta mostra os lançamentos dela; uma por vez.
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const occurrences = getOccurrences(year, month0);
  const totals = getTotals(year, month0);
  const mix = computeMix(totals);
  const cats = computeCategoryBreakdown(occurrences);

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
    trend.push({
      label: MESES_CURTOS[m.month()],
      current: i === 0,
      total: t.total,
      variaveis: t.variaveis,
      byKind: { fixo: t.fixos, variavel: t.variaveis, parcelado: t.parcelas } as Record<OccKind, number>,
    });
  }
  const maxTrend = Math.max(1, ...trend.map((r) => r.total));

  const previous = trend.slice(0, -1);
  const avgVarPrevious = previous.reduce((s, t) => s + t.variaveis, 0) / Math.max(1, previous.length);
  const varDelta = avgVarPrevious > 0 ? Math.round((trend[trend.length - 1].variaveis / avgVarPrevious - 1) * 100) : 0;

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
      renda: t.renda,
      saldo: t.livre,
      note: ending.length
        ? `Última parcela: ${ending.map((o) => o.name).join(', ')}`
        : `${t.nParc} parcelas · ${short(t.parcelas, privado)}`,
    });
  }

  const summary = [
    { label: 'Saídas', value: short(totals.total, privado), note: `${occurrences.length} lançamentos` },
    { label: 'Renda', value: short(totals.renda, privado), note: totals.renda > 0 ? 'entradas do mês' : 'nada registrado' },
    {
      label: 'Livre',
      value: totals.renda > 0 ? short(totals.livre, privado) : '—',
      note: totals.renda > 0 ? `${Math.round((totals.total / totals.renda) * 100)}% da renda comprometida` : 'sem renda no mês',
      alert: totals.renda > 0 && totals.livre < 0,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 16 }}>Painel</div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={togglePrivado}
          aria-label={privado ? 'Mostrar valores' : 'Ocultar valores'}
          style={{ width: 34, height: 34, fontSize: 16 }}
        >
          <i className={privado ? 'ph ph-eye-slash' : 'ph ph-eye'} />
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <MonthChips />
      </div>

      <div style={{ padding: '20px 0 0' }}>
        <div className="section-kicker">Painel de {MESES_LONGOS[month0]} de {year}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.3 }}>
          Para onde o mês foi
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>
          Carregando…
        </div>
      ) : isError ? (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--color-accent-300)' }}>
            {error instanceof Error ? error.message : 'Erro ao carregar os lançamentos do mês.'}
          </div>
          <button className="btn btn-secondary" onClick={refetch} style={{ marginTop: 12 }}>Tentar de novo</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 16 }}>
            {summary.map((b) => (
              <div key={b.label} className="card" style={{ padding: '11px 12px 12px' }}>
                <div className="card-kicker">{b.label}</div>
                <div
                  style={{
                    fontSize: 15, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em',
                    color: b.alert ? 'var(--color-accent-300)' : undefined,
                  }}
                >
                  {b.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3, lineHeight: 1.35 }}>{b.note}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 auto', width: 124, height: 124, borderRadius: 999, background: donut, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 84, height: 84, borderRadius: 999, background: 'var(--color-bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{short(totals.total, privado)}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-neutral-500)', marginTop: 1 }}>no mês</div>
                </div>
              </div>
            </div>
            <div style={{ flex: '1 1 180px', display: 'grid', gap: 9 }}>
              {mix.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--color-neutral-500)' }}>Nenhum lançamento neste mês.</div>
              )}
              {mix.map((m) => (
                <div key={m.kind} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: MIX_COLOR[m.kind], flex: '0 0 auto' }} />
                  <span style={{ flex: '1 1 auto', color: 'var(--color-neutral-400)' }}>
                    {m.label} <span style={{ color: 'var(--color-neutral-500)' }}>· {m.count}</span>
                  </span>
                  <span style={{ color: 'var(--color-neutral-400)' }}>{short(m.amount, privado)}</span>
                  <span style={{ fontWeight: 500, minWidth: 34, textAlign: 'right' }}>{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="section-kicker">Por categoria</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
              {cats.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>Nenhum lançamento neste mês.</div>
              )}
              {cats.map((c) => {
                const open = openCategory === c.category;
                return (
                  <div key={c.category}>
                    <button
                      onClick={() => setOpenCategory(open ? null : c.category)}
                      aria-expanded={open}
                      style={{ ...ROW_BUTTON_STYLE, padding: '7px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <i className={categoryIcon(c.category)} style={{ fontSize: 14, color: 'var(--color-neutral-400)' }} />
                        <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                          {DEBT_CATEGORY_LABELS[c.category] ?? c.category}
                          <span style={{ color: 'var(--color-neutral-500)' }}> · {c.items.length}</span>
                        </span>
                        <span style={{ color: 'var(--color-neutral-400)' }}>{short(c.amount, privado)}</span>
                        <span style={{ color: 'var(--color-neutral-500)', minWidth: 34, textAlign: 'right' }}>{c.share}%</span>
                        <i className={open ? 'ph ph-caret-down' : 'ph ph-caret-right'} style={{ fontSize: 11, color: 'var(--color-neutral-500)' }} />
                      </div>
                      <div style={{ marginTop: 6, height: 5, borderRadius: 999, background: 'var(--color-neutral-900)', overflow: 'hidden' }}>
                        <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--color-accent-500)', borderRadius: 999 }} />
                      </div>
                    </button>
                    {open && (
                      <div style={{ padding: '2px 0 8px 22px' }}>
                        {c.items.map((o) => (
                          <button
                            key={o.key}
                            onClick={() => openDetail(o, year, month0)}
                            style={{
                              ...ROW_BUTTON_STYLE, display: 'flex', justifyContent: 'space-between', gap: 12,
                              padding: '7px 0', fontSize: 12.5, opacity: o.isPaid ? 0.55 : 1,
                            }}
                          >
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {o.name}
                              <span style={{ color: 'var(--color-neutral-500)' }}>
                                {' '}· dia {o.dueDay}{o.installmentId ? ` · ${o.installmentId}/${o.installmentCount ?? '?'}` : ''}
                              </span>
                            </span>
                            <span style={{ flex: '0 0 auto', color: 'var(--color-neutral-400)' }}>
                              {money(o.amount, privado)}{o.isPaid ? ' · pago' : ''}
                            </span>
                          </button>
                        ))}
                        <button
                          className="btn btn-ghost"
                          onClick={() => navigate(debtsPathForCategory(c.category))}
                          style={{ marginTop: 2, fontSize: 12, padding: '4px 0' }}
                        >
                          Ver em Débitos <i className="ph ph-arrow-right" style={{ fontSize: 12 }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="section-kicker">Saídas · {N_TREND} meses</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 7, lineHeight: 1.5 }}>
              {avgVarPrevious > 0
                ? (varDelta >= 0
                    ? `Os gastos variáveis deste mês estão ${varDelta}% acima da média dos ${N_TREND - 1} anteriores.`
                    : `Os gastos variáveis deste mês estão ${-varDelta}% abaixo da média dos ${N_TREND - 1} anteriores.`)
                : 'Histórico de gastos variáveis insuficiente para comparação.'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 14 }}>
              {trend.map((t, i) => (
                <div key={i} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: t.current ? 'var(--color-accent-200)' : 'var(--color-neutral-400)' }}>
                    {compact(t.total, privado)}
                  </div>
                  <div
                    style={{
                      width: '100%', height: `${Math.max(4, Math.round((t.total / maxTrend) * 100))}%`,
                      display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden',
                      background: 'var(--color-neutral-900)', opacity: t.current ? 1 : 0.6,
                    }}
                  >
                    {t.total > 0 && KIND_ORDER.map((k) => (
                      <div key={k} style={{ flex: `0 0 ${(t.byKind[k] / t.total) * 100}%`, background: MIX_COLOR[k] }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: t.current ? 'var(--color-accent-200)' : 'var(--color-neutral-500)' }}>{t.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px 14px', marginTop: 10, fontSize: 11.5, color: 'var(--color-neutral-500)', flexWrap: 'wrap' }}>
              {KIND_ORDER.map((k) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: MIX_COLOR[k] }} />
                  {MIX_LABELS[k]}
                </span>
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
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{short(p.total, privado)}</div>
                  {/* Mês sem receita registrada (ex.: os futuros) não tem "livre" de verdade — só o negativo das saídas. */}
                  <div style={{ fontSize: 11, color: p.renda > 0 && p.saldo < 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-500)', marginTop: 2 }}>
                    {p.renda > 0 ? `livre ${short(p.saldo, privado)}` : 'sem renda registrada'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
