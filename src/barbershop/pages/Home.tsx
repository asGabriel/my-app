import { BellOutlined, CalendarOutlined, DownOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { App } from 'antd';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { Loading } from '../components/Loading';
import { Screen, TAB_SCREEN_SPACE } from '../layouts/Layouts';
import {
  useBarbers, useCancelAppointment, useClubPlans, useCustomer, useMyAppointments, useServices, useUnits,
} from '../mock';
import { formatDuration, greeting, relativeDay, servicesLabel, weekdayShort } from '../shared/format';
import { card, color, eyebrow, font, outlineButton, plainButton, primaryButton, roundIconButton } from '../shared/theme';

export function Home() {
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const booking = useBooking();
  const { data: customer } = useCustomer();
  const { data: appointments } = useMyAppointments();
  const { data: units } = useUnits();
  const { data: services } = useServices();
  const { data: barbers } = useBarbers();
  const { data: plans } = useClubPlans();
  const cancel = useCancelAppointment();

  if (!customer || !appointments) return <Loading />;

  const unit = units?.find((u) => u.id === customer.preferredUnitId);
  const next = appointments
    .filter((a) => a.status === 'scheduled' && dayjs(a.startsAt).isAfter(dayjs()))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const plan = plans?.find((p) => p.id === customer.clubPlanId);

  const reschedule = () => {
    if (!next) return;
    booking.start({ serviceIds: next.serviceIds, barberId: next.barberId, paymentMethod: next.paymentMethod, replacesId: next.id });
    navigate('/agendar/horario');
  };

  const confirmCancel = () => {
    if (!next) return;
    modal.confirm({
      title: 'Cancelar este horário?',
      content: next.paymentMethod === 'club' ? 'O crédito do Clube volta para a sua conta.' : undefined,
      okText: 'Cancelar horário',
      cancelText: 'Manter',
      okButtonProps: { danger: true },
      onOk: () => cancel.mutateAsync(next.id).then(() => message.success('Horário cancelado')),
    });
  };

  return (
    <Screen bottomSpace={TAB_SCREEN_SPACE} gap={28}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: font.display, fontSize: 22, letterSpacing: '0.24em', color: color.accent }}>NAVALHA</span>
          <Link to="/unidades" style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 28, fontSize: 13, color: color.muted, textDecoration: 'none' }}>
            <EnvironmentOutlined /> {unit?.name ?? '…'} <DownOutlined style={{ fontSize: 10 }} />
          </Link>
        </div>
        <button type="button" aria-label="Notificações" style={roundIconButton}>
          <BellOutlined />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 14, color: color.muted }}>{greeting()}</span>
        <h1 style={{ margin: 0, fontFamily: font.display, fontWeight: 500, fontSize: 36, lineHeight: 1.1 }}>{customer.name.split(' ')[0]}</h1>
      </div>

      {next ? (
        <section style={card} aria-label="Próximo horário">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...eyebrow, color: color.accent }}>Próximo horário</span>
            <span style={{ fontSize: 12, color: color.muted }}>{relativeDay(next.startsAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 72, flexShrink: 0, borderRadius: 14, background: color.surfaceRaised, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: color.muted, textTransform: 'uppercase' }}>{weekdayShort(next.startsAt)}</span>
              <span style={{ fontFamily: font.display, fontSize: 28, lineHeight: 1 }}>{dayjs(next.startsAt).date()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{servicesLabel(next.serviceIds, services)}</span>
              <span style={{ fontSize: 14, color: color.muted }}>
                {dayjs(next.startsAt).format('HH:mm')} · {formatDuration(next.durationMin)} · com {barbers?.find((b) => b.id === next.barberId)?.name}
              </span>
              <span style={{ fontSize: 14, color: color.muted }}>{units?.find((u) => u.id === next.unitId)?.name}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={reschedule} style={{ ...outlineButton, flex: 1, minHeight: 44, padding: 0, fontSize: 14 }}>Remarcar</button>
            <button type="button" onClick={confirmCancel} style={{ ...outlineButton, flex: 1, minHeight: 44, padding: 0, fontSize: 14, color: color.muted }}>Cancelar</button>
          </div>
        </section>
      ) : (
        <section style={{ ...card, alignItems: 'flex-start' }} aria-label="Próximo horário">
          <span style={{ ...eyebrow, color: color.accent }}>Próximo horário</span>
          <span style={{ fontSize: 15, color: color.muted }}>Você não tem nenhum horário marcado.</span>
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          booking.start();
          navigate('/agendar');
        }}
        style={{ ...primaryButton, minHeight: 56, borderRadius: 16, fontSize: 16 }}
      >
        <CalendarOutlined /> Agendar horário
      </button>

      {plan && (
        <Link
          to="/clube"
          style={{ ...plainButton, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20, border: `1px solid ${color.lineGold}`, background: color.surfaceGold, textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
            <span style={{ ...eyebrow, color: color.accent }}>Clube Navalha</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Plano {plan.name} · ativo</span>
            <span style={{ fontSize: 13, color: color.muted }}>
              {plan.monthlyCredits === null
                ? 'Cortes e barbas sem limite'
                : `${customer.clubCreditsUsed} de ${plan.monthlyCredits} créditos usados este mês`}
            </span>
          </div>
          <RightOutlined style={{ color: color.accent }} />
        </Link>
      )}
    </Screen>
  );
}
