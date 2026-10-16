import { App } from 'antd';
import { Navigate, useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { ACTION_BAR_SPACE, ActionBar } from '../components/ActionBar';
import { BackHeader } from '../components/BackHeader';
import { Loading } from '../components/Loading';
import { Screen } from '../layouts/Layouts';
import {
  useBarbers, useClubPlans, useCreateAppointment, useCustomer, useServices, useUnits, type PaymentMethod,
} from '../mock';
import { formatDay, formatDuration, formatMoney, servicesLabel } from '../shared/format';
import { color, disabledButton, displayTitle, eyebrow, primaryButton, selectableCard } from '../shared/theme';

/** Horas de antecedência para cancelar sem custo (regra exibida no rodapé). */
const FREE_CANCEL_HOURS = 2;

/** Passo 3 do agendamento: revisão e forma de pagamento. */
export function Confirm() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const booking = useBooking();
  const { draft, update } = booking;
  const { data: customer } = useCustomer();
  const { data: units } = useUnits();
  const { data: services } = useServices();
  const { data: barbers } = useBarbers();
  const { data: plans } = useClubPlans();
  const create = useCreateAppointment();

  if (!draft.serviceIds.length || !draft.date || !draft.time) return <Navigate to="/agendar" replace />;
  if (!customer || !services || !units) return <Loading />;

  const unit = units.find((u) => u.id === customer.preferredUnitId)!;
  const durationMin = draft.serviceIds.reduce((sum, id) => sum + services.find((s) => s.id === id)!.durationMin, 0);
  const totalCents = draft.serviceIds.reduce((sum, id) => sum + services.find((s) => s.id === id)!.priceCents, 0);

  const plan = plans?.find((p) => p.id === customer.clubPlanId);
  const creditsLeft = !plan ? 0 : plan.monthlyCredits === null ? Infinity : plan.monthlyCredits - customer.clubCreditsUsed;
  const allInClub = draft.serviceIds.every((id) => services.find((s) => s.id === id)!.includedInClub);
  // Remarcar um horário pago com crédito não consome outro crédito.
  const clubUsable = !!plan && allInClub && (creditsLeft > 0 || draft.paymentMethod === 'club' && !!draft.replacesId);

  const methods: { id: PaymentMethod; title: string; sub: string; price: string; enabled: boolean }[] = [
    {
      id: 'club',
      title: 'Usar crédito do Clube',
      sub: !plan
        ? 'Assine o Clube para usar créditos'
        : !allInClub
          ? 'Algum serviço não está incluso no Clube'
          : plan.monthlyCredits === null
            ? 'Plano ilimitado'
            : `Restam ${creditsLeft} de ${plan.monthlyCredits} créditos este mês`,
      price: formatMoney(0),
      enabled: clubUsable,
    },
    { id: 'app', title: 'Pagar agora', sub: 'Pix ou cartão pelo app', price: formatMoney(totalCents), enabled: true },
    { id: 'local', title: 'Pagar na barbearia', sub: 'No balcão, após o serviço', price: formatMoney(totalCents), enabled: true },
  ];
  const chosen = draft.paymentMethod && methods.find((m) => m.id === draft.paymentMethod)?.enabled
    ? draft.paymentMethod
    : clubUsable ? 'club' : 'app';

  const rows = [
    { label: 'Serviço', value: `${servicesLabel(draft.serviceIds, services)} · ${formatDuration(durationMin)}` },
    { label: 'Barbeiro', value: barbers?.find((b) => b.id === draft.barberId)?.name ?? 'Primeiro disponível' },
    { label: 'Quando', value: `${formatDay(draft.date)} · ${draft.time}` },
    { label: 'Onde', value: unit.name, sub: unit.address },
  ];

  const submit = () =>
    create.mutate(
      {
        unitId: unit.id,
        barberId: draft.barberId,
        serviceIds: draft.serviceIds,
        startsAt: `${draft.date}T${draft.time}:00`,
        paymentMethod: chosen,
        replacesId: draft.replacesId,
      },
      {
        onSuccess: () => {
          message.success(draft.replacesId ? 'Horário remarcado' : 'Horário agendado');
          booking.start();
          navigate('/');
        },
        onError: (error) => message.error(error.message),
      }
    );

  return (
    <>
      <Screen bottomSpace={ACTION_BAR_SPACE + 24} gap={22}>
        <BackHeader to="/agendar/horario" caption={draft.replacesId ? 'Remarcar horário' : 'Passo 3 de 3'} />
        <h1 style={displayTitle}>Tudo certo?</h1>

        <dl style={{ margin: 0, background: color.surface, border: `1px solid ${color.line}`, borderRadius: 20, padding: '6px 20px' }}>
          {rows.map((r, i) => (
            <div
              key={r.label}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: i < rows.length - 1 ? `1px solid ${color.line}` : undefined }}
            >
              <dt style={{ fontSize: 14, color: color.muted }}>{r.label}</dt>
              <dd style={{ margin: 0, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                {r.value}
                {r.sub && <span style={{ display: 'block', fontWeight: 400, color: color.muted }}>{r.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={eyebrow}>Pagamento</span>
          <div role="radiogroup" aria-label="Forma de pagamento" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methods.map((m) => {
              const on = chosen === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!m.enabled}
                  onClick={() => update({ paymentMethod: m.id })}
                  style={{ ...selectableCard(on), alignItems: 'center', gap: 14, padding: '14px 16px', ...(!m.enabled && disabledButton) }}
                >
                  <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 9, boxSizing: 'border-box', border: on ? `6px solid ${color.accent}` : `2px solid ${color.subtle}` }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{m.title}</span>
                    <span style={{ fontSize: 13, color: color.muted }}>{m.sub}</span>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: color.accent, whiteSpace: 'nowrap' }}>{m.price}</span>
                </button>
              );
            })}
          </div>
        </section>
      </Screen>

      <ActionBar>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            type="button"
            disabled={create.isPending}
            onClick={submit}
            style={{ ...primaryButton, minHeight: 56, borderRadius: 16, fontSize: 16, ...(create.isPending && disabledButton) }}
          >
            {create.isPending ? 'Confirmando…' : draft.replacesId ? 'Confirmar remarcação' : 'Confirmar agendamento'}
          </button>
          <span style={{ fontSize: 12, color: color.muted, textAlign: 'center' }}>
            Cancelamento grátis até {FREE_CANCEL_HOURS} horas antes.
          </span>
        </div>
      </ActionBar>
    </>
  );
}
