import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { ACTION_BAR_SPACE, ActionBar, ActionSummary } from '../components/ActionBar';
import { BackHeader } from '../components/BackHeader';
import { Loading } from '../components/Loading';
import { Screen } from '../layouts/Layouts';
import { useAvailableSlots, useBarbers, useCustomer, useServices, useUnits } from '../mock';
import { formatDay, initials, servicesLabel, weekdayShort } from '../shared/format';
import { color, disabledButton, displayTitle, eyebrow, font, plainButton, primaryButton } from '../shared/theme';

const DAYS_SHOWN = 6;

/** Passo 2 do agendamento: barbeiro, dia e horário. */
export function Schedule() {
  const navigate = useNavigate();
  const { draft, update } = useBooking();
  const { data: customer } = useCustomer();
  const { data: units } = useUnits();
  const { data: services } = useServices();
  const unitId = customer?.preferredUnitId;
  const unit = units?.find((u) => u.id === unitId);
  const { data: barbers } = useBarbers(unitId);

  // Próximos dias em que a unidade abre.
  const days = useMemo(() => {
    if (!unit) return [];
    const list: string[] = [];
    for (let d = dayjs(); list.length < DAYS_SHOWN; d = d.add(1, 'day')) {
      if (!unit.closedWeekdays.includes(d.day())) list.push(d.format('YYYY-MM-DD'));
    }
    return list;
  }, [unit]);
  const date = draft.date && days.includes(draft.date) ? draft.date : days[0];

  const durationMin = draft.serviceIds.reduce((sum, id) => sum + (services?.find((s) => s.id === id)?.durationMin ?? 0), 0);
  const { data: slots, isFetching } = useAvailableSlots(
    { unitId: unitId ?? '', barberId: draft.barberId, date: date ?? '', durationMin },
    !!unitId && !!date && !!services
  );
  // Um horário escolhido antes pode ter deixado de valer ao trocar barbeiro/dia.
  const time = slots?.some((s) => s.time === draft.time && s.available) ? draft.time : null;

  if (!draft.serviceIds.length) return <Navigate to="/agendar" replace />;

  const barberOptions = [{ id: null, name: 'Qualquer um' }, ...(barbers ?? [])];
  const barberName = barberOptions.find((b) => b.id === draft.barberId)?.name ?? 'Qualquer um';

  return (
    <>
      <Screen bottomSpace={ACTION_BAR_SPACE} gap={22}>
        <BackHeader to={draft.replacesId ? '/' : '/agendar'} caption={draft.replacesId ? 'Remarcar horário' : 'Passo 2 de 3'} />
        <h1 style={displayTitle}>Com quem e quando?</h1>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={eyebrow}>Barbeiro</span>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {barberOptions.map((b) => {
              const on = draft.barberId === b.id;
              return (
                <button
                  key={b.id ?? 'any'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ barberId: b.id })}
                  style={{ ...plainButton, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 70, flexShrink: 0, padding: 2 }}
                >
                  <span
                    style={{
                      width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: font.display, fontSize: 20, background: color.surfaceRaised,
                      boxShadow: `0 0 0 2px ${on ? color.accent : color.line}`, color: on ? color.accent : color.ink,
                    }}
                  >
                    {b.id ? initials(b.name) : '·'}
                  </span>
                  <span style={{ fontSize: 12, textAlign: 'center' }}>{b.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={eyebrow}>{date ? dayjs(date).format('MMMM') : ''}</span>
            <span style={{ fontSize: 12, color: color.muted }}>{unit?.name}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${DAYS_SHOWN}, minmax(0, 1fr))`, gap: 8 }}>
            {days.map((d) => {
              const on = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ date: d })}
                  style={{
                    ...plainButton, minHeight: 60, borderRadius: 14, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    ...(on
                      ? { background: color.accent, color: color.onAccent }
                      : { background: color.surface, border: `1px solid ${color.line}` }),
                  }}
                >
                  <span style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.8 }}>{weekdayShort(d)}</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{dayjs(d).date()}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={eyebrow}>Horários livres</span>
          {!slots || isFetching ? (
            <Loading />
          ) : !slots.some((s) => s.available) ? (
            <span style={{ fontSize: 14, color: color.muted }}>Nenhum horário livre nesse dia. Tente outro dia ou outro barbeiro.</span>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {slots.map((s) => {
                const on = s.time === time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    aria-pressed={on}
                    onClick={() => update({ date, time: s.time })}
                    style={{
                      ...plainButton, boxSizing: 'border-box', minHeight: 44, borderRadius: 12, textAlign: 'center',
                      fontSize: 14, fontWeight: 600,
                      ...(!s.available
                        ? { border: `1px dashed ${color.line}`, color: color.subtle, textDecoration: 'line-through', cursor: 'not-allowed' }
                        : on
                          ? { border: `1px solid ${color.accent}`, color: color.accent }
                          : { background: color.surface, border: `1px solid ${color.line}` }),
                    }}
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </Screen>

      <ActionBar>
        <ActionSummary
          label={`${servicesLabel(draft.serviceIds, services)} · ${barberName}`}
          value={time && date ? `${formatDay(date)} · ${time}` : 'Escolha um horário'}
        />
        <button
          type="button"
          disabled={!time}
          onClick={() => {
            update({ date, time });
            navigate('/agendar/confirmar');
          }}
          style={{ ...primaryButton, ...(!time && disabledButton) }}
        >
          Revisar
        </button>
      </ActionBar>
    </>
  );
}
