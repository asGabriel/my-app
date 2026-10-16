import { LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { App } from 'antd';
import dayjs from 'dayjs';
import { useState, type CSSProperties } from 'react';
import { Loading } from '../../components/Loading';
import { Screen, TAB_SCREEN_SPACE } from '../../layouts/Layouts';
import {
  CURRENT_BARBER_ID, useBarberAgenda, useBarbers, useServices, useSetAppointmentDone, useUnits, type Appointment,
} from '../../mock';
import { formatDay, formatDuration, relativeDay, servicesLabel } from '../../shared/format';
import { color, font, plainButton, primaryButton, roundIconButton } from '../../shared/theme';

/** Buraco mínimo na agenda para aparecer como "horário livre". */
const MIN_GAP_MIN = 30;

type Row =
  | { kind: 'booked'; time: string; appointment: Appointment }
  | { kind: 'free'; time: string; durationMin: number };

const minutesOf = (iso: string) => dayjs(iso).hour() * 60 + dayjs(iso).minute();
const toHHmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const hhmmToMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

type AgendaStatus = 'done' | 'live' | 'scheduled';

function badgeStyle(status: AgendaStatus): CSSProperties {
  const base: CSSProperties = { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap' };
  if (status === 'live') return { ...base, background: color.accent, color: color.onAccent };
  return { ...base, border: `1px solid ${color.lineStrong}`, color: status === 'done' ? color.muted : color.ink };
}

const STATUS_LABEL = { done: 'Concluído', live: 'Em atendimento', scheduled: 'Agendado' } as const;

interface BookedCardProps {
  appointment: Appointment;
  status: AgendaStatus;
  servicesText: string;
  /** Marca (true) ou desmarca (false) como concluído. */
  onToggle: (done: boolean) => void;
}

function BookedCard({ appointment: a, status, servicesText, onToggle }: BookedCardProps) {
  return (
    <button
      type="button"
      aria-pressed={status === 'done'}
      aria-label={`${a.customerName}, ${STATUS_LABEL[status]}. Toque para ${status === 'done' ? 'reabrir' : 'marcar como concluído'}`}
      onClick={() => onToggle(status !== 'done')}
      style={{
        ...plainButton, flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 16px',
        borderRadius: 14, background: color.surface, border: `1px solid ${status === 'live' ? color.accent : color.line}`,
        opacity: status === 'done' ? 0.7 : 1,
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{a.customerName}</span>
        <span style={badgeStyle(status)}>{STATUS_LABEL[status]}</span>
      </span>
      <span style={{ fontSize: 13, color: color.muted }}>
        {servicesText} · {formatDuration(a.durationMin)}
      </span>
      {a.customerIsClubMember && <span style={{ fontSize: 12, color: color.accent }}>Assinante do Clube</span>}
    </button>
  );
}

export function Agenda() {
  const { message } = App.useApp();
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const { data: agenda } = useBarberAgenda(CURRENT_BARBER_ID, date);
  const { data: barbers } = useBarbers();
  const { data: units } = useUnits();
  const { data: services } = useServices();
  const setDone = useSetAppointmentDone();

  const me = barbers?.find((b) => b.id === CURRENT_BARBER_ID);
  // O barbeiro roda entre unidades; o dia pertence à unidade dos atendimentos.
  const unit = units?.find((u) => u.id === (agenda?.[0]?.unitId ?? me?.unitIds[0]));

  const rows: Row[] = [];
  if (agenda && unit && !unit.closedWeekdays.includes(dayjs(date).day())) {
    let cursor = hhmmToMin(unit.opensAt);
    const pushGap = (until: number) => {
      if (until - cursor >= MIN_GAP_MIN) rows.push({ kind: 'free', time: toHHmm(cursor), durationMin: until - cursor });
    };
    for (const a of agenda) {
      pushGap(minutesOf(a.startsAt));
      rows.push({ kind: 'booked', time: dayjs(a.startsAt).format('HH:mm'), appointment: a });
      cursor = Math.max(cursor, minutesOf(a.startsAt) + a.durationMin);
    }
    pushGap(hhmmToMin(unit.closesAt));
  }

  const now = dayjs();
  const statusOf = (a: Appointment): AgendaStatus => {
    if (a.status === 'done') return 'done';
    const start = dayjs(a.startsAt);
    return !now.isBefore(start) && now.isBefore(start.add(a.durationMin, 'minute')) ? 'live' : 'scheduled';
  };
  const booked = agenda?.length ?? 0;
  const club = agenda?.filter((a) => a.customerIsClubMember).length ?? 0;
  const free = rows.filter((r) => r.kind === 'free').length;
  const isToday = relativeDay(date) === 'hoje';

  return (
    <Screen bottomSpace={TAB_SCREEN_SPACE} gap={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: color.muted }}>{me?.name ?? '…'} · {unit?.name ?? '…'}</span>
          <h1 style={{ margin: 0, fontFamily: font.display, fontWeight: 500, fontSize: 30 }}>
            {isToday ? `Hoje, ${dayjs(date).format('D MMM').replace('.', '')}` : formatDay(date)}
          </h1>
        </div>
        <button
          type="button"
          aria-label="Bloquear horário"
          onClick={() => message.info('Bloqueio de horário disponível em breve.')}
          style={{ ...primaryButton, width: 44, minHeight: 44, height: 44, padding: 0, borderRadius: 22 }}
        >
          <PlusOutlined />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" aria-label="Dia anterior" onClick={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))} style={roundIconButton}>
          <LeftOutlined />
        </button>
        <button
          type="button"
          disabled={isToday}
          onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}
          style={{ ...plainButton, flexGrow: 1, minHeight: 44, textAlign: 'center', fontSize: 13, fontWeight: 600, color: isToday ? color.muted : color.accent, cursor: isToday ? 'default' : 'pointer' }}
        >
          {isToday ? relativeDay(date) : 'Voltar para hoje'}
        </button>
        <button type="button" aria-label="Próximo dia" onClick={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))} style={roundIconButton}>
          <RightOutlined />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          [booked, 'agendados'],
          [club, 'do Clube'],
          [free, 'livres'],
        ].map(([value, label]) => (
          <div key={label} style={{ background: color.surface, border: `1px solid ${color.line}`, borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
            <span style={{ fontSize: 12, color: color.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {!agenda || !unit ? (
        <Loading />
      ) : !rows.length ? (
        <span style={{ fontSize: 14, color: color.muted }}>Sem expediente nesse dia.</span>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => (
            <li key={`${row.kind}-${row.time}`} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
              <span style={{ width: 44, flexShrink: 0, paddingTop: 14, fontSize: 13, fontWeight: 600, color: color.muted }}>{row.time}</span>
              {row.kind === 'free' ? (
                <button
                  type="button"
                  onClick={() => message.info('Encaixe de cliente disponível em breve.')}
                  style={{ ...plainButton, flexGrow: 1, minHeight: 48, borderRadius: 14, border: `1px dashed ${color.lineStrong}`, color: color.muted, fontSize: 13, padding: '0 16px' }}
                >
                  Horário livre · {formatDuration(row.durationMin)} · encaixar cliente
                </button>
              ) : (
                <BookedCard
                  appointment={row.appointment}
                  status={statusOf(row.appointment)}
                  servicesText={servicesLabel(row.appointment.serviceIds, services)}
                  onToggle={(done) => setDone.mutate({ id: row.appointment.id, done })}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </Screen>
  );
}
