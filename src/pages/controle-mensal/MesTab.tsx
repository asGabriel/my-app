import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useFinanceMonth, MESES_LONGOS } from '../../finance/FinanceMonthContext';
import { money, short } from '../../finance/format';
import { categoryIcon } from '../../finance/categoryIcon';
import { KIND_LABELS, type Occurrence } from '../../finance/monthEngine';
import { MonthChips } from './MonthChips';

interface OccGroup {
  label: string;
  items: Occurrence[];
  sum: number;
}

function groupOccurrences(occurrences: Occurrence[], isNow: boolean, isPast: boolean, todayDate: number): OccGroup[] {
  const sum = (items: Occurrence[]) => items.reduce((s, o) => s + o.amount, 0);

  if (isNow) {
    const buckets: Occurrence[][] = [[], [], []];
    occurrences.forEach((o) => {
      if (o.isPaid) buckets[0].push(o);
      else if (o.dueDay <= todayDate + 7) buckets[1].push(o);
      else buckets[2].push(o);
    });
    const labels = ['Já saiu da conta', 'Nos próximos 7 dias', 'Depois neste mês'];
    return buckets
      .map((items, i) => ({ label: labels[i], items, sum: sum(items) }))
      .filter((g) => g.items.length > 0);
  }

  const paid = occurrences.filter((o) => o.isPaid);
  const unpaid = occurrences.filter((o) => !o.isPaid);
  const groups: OccGroup[] = [];
  if (paid.length) groups.push({ label: 'Pago', items: paid, sum: sum(paid) });
  if (unpaid.length) groups.push({ label: isPast ? 'Em atraso' : 'Programado', items: unpaid, sum: sum(unpaid) });
  return groups;
}

function OccRow({ occurrence, onPay, onTap }: { occurrence: Occurrence; onPay: () => void; onTap: () => void }) {
  const { privado } = useFinanceMonth();
  const o = occurrence;
  const parcial = !o.isPaid && o.paidAmount > 0.01;
  const tag = parcial
    ? `falta ${short(o.amount - o.paidAmount, privado)}`
    : o.installmentId
      ? `${o.installmentId}/${o.installmentCount}`
      : o.isPaid
        ? 'pago'
        : o.projected
          ? 'automático'
          : 'a pagar';
  const tagColor = parcial || o.installmentId ? 'var(--color-accent-300)' : 'var(--color-neutral-500)';

  return (
    <div style={{ borderTop: '1px solid var(--color-divider)' }}>
      <div
        onClick={onTap}
        style={{
          display: 'grid',
          gridTemplateColumns: '34px minmax(0, 1fr) auto',
          gap: 12,
          alignItems: 'center',
          padding: '11px 0',
          cursor: 'pointer',
          opacity: o.isPaid ? 0.55 : 1,
        }}
      >
        <div className="avatar-icon" style={{ width: 34, height: 34, fontSize: 16 }}>
          <i className={categoryIcon(o.category)} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {o.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2 }}>
            dia {o.dueDay} · {KIND_LABELS[o.kind]}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{money(o.amount, privado)}</div>
            <div style={{ fontSize: 11, color: tagColor, marginTop: 2 }}>{tag}</div>
          </div>
          {!o.isPaid && o.debtId && (
            <button
              className="btn btn-primary"
              onClick={(e) => { e.stopPropagation(); onPay(); }}
              style={{ flex: '0 0 auto', padding: '4px 9px', fontSize: 11, borderRadius: 999 }}
            >
              {parcial ? 'Concluir' : 'Pagar'}
            </button>
          )}
          <i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--color-neutral-500)' }} />
        </div>
      </div>
    </div>
  );
}

export function MesTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { selected, getOccurrences, getTotals, privado, togglePrivado, openDetail, openPay } = useFinanceMonth();
  const { year, month0 } = selected;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const today = dayjs();
  const monthIdx = year * 12 + month0;
  const todayIdx = today.year() * 12 + today.month();
  const isNow = monthIdx === todayIdx;
  const isPast = monthIdx < todayIdx;

  const occurrences = getOccurrences(year, month0);
  const totals = getTotals(year, month0);

  const groups = useMemo(
    () => groupOccurrences(occurrences, isNow, isPast, today.date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occurrences, isNow, isPast]
  );

  const pctSaiu = totals.renda > 0 ? Math.min(100, Math.round((totals.saiu / totals.renda) * 100)) : 0;
  const pctVaiSair = totals.renda > 0 ? Math.min(100 - pctSaiu, Math.round((totals.vaiSair / totals.renda) * 100)) : 0;
  const pctParcelasRenda = totals.renda > 0 ? Math.round((totals.parcelas / totals.renda) * 100) : 0;

  const alerta = useMemo(() => {
    if (totals.livre < 0) {
      return {
        icon: 'ph ph-warning-circle',
        text: `Este mês as saídas passam o que entra em ${short(-totals.livre, privado)}. Vale olhar com calma antes de assumir algo novo.`,
      };
    }
    if (pctParcelasRenda > 30) {
      return {
        icon: 'ph ph-warning-circle',
        text: `Suas parcelas ocupam ${pctParcelasRenda}% do que entra — acima dos 30% que costumam caber com folga.`,
      };
    }
    return {
      icon: 'ph ph-sparkle',
      text: `Dá pra respirar: sobram ${short(totals.livre, privado)} depois de tudo que já tem destino, e as parcelas ocupam só ${pctParcelasRenda}% da renda.`,
    };
  }, [totals, pctParcelasRenda, privado]);

  const daysInMonth = dayjs(new Date(year, month0, 1)).daysInMonth();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar-icon" style={{ width: 34, height: 34, fontSize: 14, fontWeight: 500, background: 'var(--color-accent-900)' }}>
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 16 }}>
            Oi, {user?.name?.split(' ')[0] ?? 'você'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={togglePrivado}
            aria-label={privado ? 'Mostrar valores' : 'Ocultar valores'}
            style={{ width: 34, height: 34, fontSize: 16 }}
          >
            <i className={privado ? 'ph ph-eye-slash' : 'ph ph-eye'} />
          </button>
          {/* Só no mobile — no desktop "Sair" já está na sidebar "Controle". */}
          <button
            className="btn btn-ghost btn-icon mobile-only"
            onClick={handleLogout}
            aria-label="Sair"
            style={{ width: 34, height: 34, fontSize: 16 }}
          >
            <i className="ph ph-sign-out" />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <MonthChips />
      </div>

      <div style={{ padding: '20px 0 0' }}>
        <div className="section-kicker">
          Livre até {daysInMonth} de {MESES_LONGOS[month0]}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 40, letterSpacing: '-0.03em',
            lineHeight: 1.1, marginTop: 6, color: totals.livre < 0 ? 'var(--color-accent-300)' : 'var(--color-text)',
          }}
        >
          {money(totals.livre, privado)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 8, lineHeight: 1.45 }}>
          De {short(totals.renda, privado)} que entram, {short(totals.total, privado)} já têm destino neste mês.
        </div>
      </div>

      <div style={{ marginTop: 18, height: 8, borderRadius: 999, background: 'var(--color-neutral-900)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${pctSaiu}%`, height: '100%', background: 'var(--color-accent-600)' }} />
        <div style={{ width: `${pctVaiSair}%`, height: '100%', background: 'var(--color-accent-400)' }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 9, fontSize: 11.5, color: 'var(--color-neutral-500)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-accent-600)' }} />
          Já saiu {short(totals.saiu, privado)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-accent-400)' }} />
          Ainda sai {short(totals.vaiSair, privado)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 18 }}>
        {[
          { label: 'Custo fixo', value: short(totals.fixos, privado), note: `${totals.nFix} regras sem fim` },
          { label: 'Variáveis', value: short(totals.variaveis, privado), note: `${totals.nVar} contas que oscilam` },
          { label: 'Parcelas', value: short(totals.parcelas, privado), note: `${totals.nParc} com fim marcado` },
          { label: 'Renda', value: short(totals.renda, privado), note: 'entradas do mês' },
        ].map((b) => (
          <div key={b.label} className="card" style={{ padding: '11px 12px 12px' }}>
            <div className="card-kicker">{b.label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginTop: 5, letterSpacing: '-0.015em' }}>{b.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3 }}>{b.note}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: '12px 13px',
          borderRadius: 'var(--radius-md)', background: 'var(--color-accent-900)', border: '1px solid var(--color-accent-700)',
        }}
      >
        <i className={alerta.icon} style={{ color: 'var(--color-accent-300)', fontSize: 16, lineHeight: 1.35 }} />
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-accent-200)' }}>{alerta.text}</div>
      </div>

      {groups.length === 0 ? (
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center', padding: '24px 0' }}>
          Nenhum lançamento neste mês.
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label} style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 }}>
              <div className="section-kicker">{g.label}</div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-500)' }}>{short(g.sum, privado)}</div>
            </div>
            {g.items.map((o) => (
              <OccRow
                key={o.key}
                occurrence={o}
                onPay={() => openPay(o, year, month0)}
                onTap={() => openDetail(o, year, month0)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
