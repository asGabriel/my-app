import { BellOutlined, CreditCardOutlined, EditOutlined, QuestionCircleOutlined, RightOutlined } from '@ant-design/icons';
import { App, Switch } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { Loading } from '../components/Loading';
import { Screen, TAB_SCREEN_SPACE } from '../layouts/Layouts';
import {
  useBarbers, useClubPlans, useCustomer, useMyAppointments, useServices, useUnits, useUpdateCustomer,
} from '../mock';
import { initials, servicesLabel } from '../shared/format';
import { color, eyebrow, font, pill, plainButton, roundIconButton } from '../shared/theme';

const HISTORY_SHOWN = 3;

const panel = { background: color.surface, border: `1px solid ${color.line}`, borderRadius: 16 } as const;

function SettingsRow({ icon, children, onClick, last }: { icon: ReactNode; children: ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...plainButton, minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, borderBottom: last ? undefined : `1px solid ${color.line}` }}
    >
      <span style={{ color: color.muted, fontSize: 18, display: 'flex' }}>{icon}</span>
      <span style={{ flexGrow: 1 }}>{children}</span>
      <RightOutlined style={{ color: color.muted, fontSize: 12 }} />
    </button>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const booking = useBooking();
  const { data: customer } = useCustomer();
  const { data: appointments } = useMyAppointments();
  const { data: services } = useServices();
  const { data: barbers } = useBarbers();
  const { data: units } = useUnits();
  const { data: plans } = useClubPlans();
  const updateCustomer = useUpdateCustomer();

  if (!customer || !appointments) return <Loading />;

  const plan = plans?.find((p) => p.id === customer.clubPlanId);
  const barberName = (id: string | null) => barbers?.find((b) => b.id === id)?.name ?? '—';
  const unitName = (id: string) => units?.find((u) => u.id === id)?.name.replace('Unidade ', '') ?? '—';
  const history = appointments
    .filter((a) => a.status === 'done')
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .slice(0, HISTORY_SHOWN);
  const soon = () => message.info('Disponível em breve.');

  return (
    <Screen bottomSpace={TAB_SCREEN_SPACE} gap={20}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 68, height: 68, flexShrink: 0, borderRadius: 34, background: color.surfaceRaised, boxShadow: `0 0 0 2px ${color.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontSize: 24, color: color.accent }}>
          {initials(customer.name)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontFamily: font.display, fontSize: 24 }}>{customer.name}</span>
          <span style={{ fontSize: 13, color: color.muted }}>{customer.phone}</span>
          {plan && <span style={pill('gold')}>Clube · {plan.name}</span>}
        </div>
        <button type="button" aria-label="Editar perfil" onClick={soon} style={roundIconButton}>
          <EditOutlined />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 4, padding: 14 }}>
          <span style={{ fontSize: 12, color: color.muted }}>Barbeiro favorito</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{barberName(customer.favoriteBarberId)}</span>
        </div>
        <Link to="/unidades" style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 4, padding: 14, color: color.ink, textDecoration: 'none' }}>
          <span style={{ fontSize: 12, color: color.muted }}>Unidade preferida</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{unitName(customer.preferredUnitId)}</span>
        </Link>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={eyebrow}>Últimos atendimentos</span>
        {history.length ? (
          <ul style={{ ...panel, listStyle: 'none', margin: 0, padding: '4px 16px' }}>
            {history.map((a, i) => (
              <li key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < history.length - 1 ? `1px solid ${color.line}` : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{servicesLabel(a.serviceIds, services)}</span>
                  <span style={{ fontSize: 12, color: color.muted }}>
                    {dayjs(a.startsAt).format('D MMM').replace('.', '')} · {barberName(a.barberId)} · {unitName(a.unitId)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    booking.start({ serviceIds: a.serviceIds, barberId: a.barberId });
                    navigate('/agendar/horario');
                  }}
                  style={{ ...plainButton, minHeight: 44, fontSize: 13, fontWeight: 600, color: color.accent }}
                >
                  Repetir
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: 14, color: color.muted }}>Nenhum atendimento ainda.</span>
        )}
      </section>

      <div style={{ ...panel, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
        <SettingsRow icon={<CreditCardOutlined />} onClick={soon}>Formas de pagamento</SettingsRow>
        <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, borderBottom: `1px solid ${color.line}` }}>
          <span style={{ color: color.muted, fontSize: 18, display: 'flex' }}><BellOutlined /></span>
          <label htmlFor="lembretes" style={{ flexGrow: 1 }}>Lembrete antes do horário</label>
          <Switch
            id="lembretes"
            checked={customer.remindersEnabled}
            loading={updateCustomer.isPending}
            onChange={(checked) => updateCustomer.mutate({ remindersEnabled: checked })}
          />
        </div>
        <SettingsRow icon={<QuestionCircleOutlined />} onClick={soon} last>Ajuda e contato</SettingsRow>
      </div>

      <Link to="/entrar" style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: color.danger, textDecoration: 'none' }}>
        Sair da conta
      </Link>
    </Screen>
  );
}
