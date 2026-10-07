import { Select } from 'antd';
import { useState } from 'react';
import { Loading } from '../../components/Loading';
import { Screen, TAB_SCREEN_SPACE } from '../../layouts/Layouts';
import { CURRENT_BARBER_ID, useBarbers, useUnitDashboard, useUnits, type DashboardPeriod } from '../../mock';
import { formatMoney } from '../../shared/format';
import { color, eyebrow, font, plainButton } from '../../shared/theme';

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'day', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
];

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

const tile = {
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
} as const;

export function Dashboard() {
  const { data: barbers } = useBarbers();
  const { data: units } = useUnits();
  const me = barbers?.find((b) => b.id === CURRENT_BARBER_ID);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const currentUnit = unitId ?? me?.unitIds[0];
  const { data: dashboard } = useUnitDashboard(currentUnit ?? '', period, !!currentUnit);

  return (
    <Screen bottomSpace={TAB_SCREEN_SPACE} gap={20}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Select
          aria-label="Unidade"
          variant="borderless"
          value={currentUnit}
          onChange={setUnitId}
          options={units?.filter((u) => me?.unitIds.includes(u.id)).map((u) => ({ value: u.id, label: u.name }))}
          style={{ alignSelf: 'flex-start', marginLeft: -11, color: color.muted }}
          popupMatchSelectWidth={false}
        />
        <h1 style={{ margin: 0, fontFamily: font.display, fontWeight: 500, fontSize: 30 }}>Painel</h1>
      </div>

      <div role="tablist" aria-label="Período" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', padding: 4, borderRadius: 14, background: color.surface, border: `1px solid ${color.line}` }}>
        {PERIODS.map((p) => {
          const on = p.key === period;
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setPeriod(p.key)}
              style={{ ...plainButton, minHeight: 40, borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, ...(on ? { background: color.ink, color: color.onAccent } : { color: color.muted }) }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {!dashboard ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div style={{ gridColumn: 'span 2', background: color.surfaceGold, border: `1px solid ${color.lineGold}`, borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ ...eyebrow, color: color.accent }}>Faturamento</span>
              <span style={{ fontFamily: font.display, fontSize: 34 }}>{formatMoney(dashboard.revenueCents)}</span>
              <span style={{ fontSize: 13, color: color.muted }}>Serviços avulsos + assinaturas do Clube</span>
            </div>
            {[
              [dashboard.appointments, 'atendimentos'],
              [percent(dashboard.occupancy), 'ocupação da agenda'],
              [dashboard.activeSubscribers, 'assinantes ativos'],
              [dashboard.renewingThisWeek, 'renovam esta semana'],
            ].map(([value, label]) => (
              <div key={label} style={tile}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
                <span style={{ fontSize: 12, color: color.muted }}>{label}</span>
              </div>
            ))}
          </div>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={eyebrow}>Equipe · ocupação</span>
            {dashboard.team.map((m) => (
              <div key={m.barberId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: color.muted }}>{percent(m.occupancy)}</span>
                </div>
                <div
                  role="meter"
                  aria-label={`Ocupação de ${m.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(m.occupancy * 100)}
                  style={{ height: 8, borderRadius: 4, background: color.line, overflow: 'hidden' }}
                >
                  <div style={{ height: '100%', borderRadius: 4, background: color.accent, width: percent(m.occupancy) }} />
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </Screen>
  );
}
