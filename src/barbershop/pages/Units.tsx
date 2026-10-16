import { CheckOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import { App } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { ACTION_BAR_SPACE, ActionBar } from '../components/ActionBar';
import { BackHeader } from '../components/BackHeader';
import { Loading } from '../components/Loading';
import { Screen } from '../layouts/Layouts';
import { useCustomer, useUnits, useUpdateCustomer, type Unit } from '../mock';
import { formatDay, relativeDay } from '../shared/format';
import { color, disabledButton, displayTitle, pill, plainButton, primaryButton, selectableCard } from '../shared/theme';

const hourLabel = (hhmm: string) => hhmm.replace(':00', 'h').replace(':', 'h');

function openStatus(unit: Unit): { open: boolean; label: string } {
  const now = dayjs();
  const hhmm = now.format('HH:mm');
  if (unit.closedWeekdays.includes(now.day())) return { open: false, label: 'Fechado hoje' };
  if (hhmm < unit.opensAt) return { open: false, label: `Fechado · abre às ${hourLabel(unit.opensAt)}` };
  if (hhmm >= unit.closesAt) return { open: false, label: 'Fechado agora' };
  return { open: true, label: `Aberto · até ${hourLabel(unit.closesAt)}` };
}

function nextFreeLabel(iso: string) {
  const when = relativeDay(iso);
  const day = when === 'hoje' || when === 'amanhã' ? when : formatDay(iso);
  return `Próximo horário livre: ${day}, ${dayjs(iso).format('HH:mm')}`;
}

export function Units() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const booking = useBooking();
  const { data: customer } = useCustomer();
  const { data: units } = useUnits();
  const updateCustomer = useUpdateCustomer();
  const [query, setQuery] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const picked = pickedId ?? customer?.preferredUnitId;
  const pickedUnit = units?.find((u) => u.id === picked);
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const visible = units?.filter((u) => normalize(`${u.name} ${u.address}`).includes(normalize(query.trim())));

  const confirm = () => {
    if (!pickedUnit) return;
    updateCustomer.mutate(
      { preferredUnitId: pickedUnit.id },
      {
        onSuccess: () => {
          booking.start();
          navigate('/agendar');
        },
      }
    );
  };

  return (
    <>
      <Screen bottomSpace={ACTION_BAR_SPACE} gap={18}>
        <BackHeader to="/" />
        <h1 style={displayTitle}>Escolha a unidade</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 16px', borderRadius: 14, background: color.surface, border: `1px solid ${color.line}` }}>
          <SearchOutlined style={{ color: color.muted }} />
          <input
            type="search"
            aria-label="Buscar unidade"
            placeholder="Bairro, rua ou nome da unidade"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flexGrow: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', color: color.ink, font: 'inherit', fontSize: 15 }}
          />
        </div>

        <button
          type="button"
          onClick={() => message.info('As unidades já estão ordenadas pela distância até você.')}
          style={{ ...plainButton, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, fontSize: 14, fontWeight: 600, color: color.accent }}
        >
          <SendOutlined /> Usar minha localização
        </button>

        {!visible ? (
          <Loading />
        ) : !visible.length ? (
          <span style={{ fontSize: 14, color: color.muted }}>Nenhuma unidade encontrada.</span>
        ) : (
          <div role="radiogroup" aria-label="Unidades" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map((u) => {
              const on = u.id === picked;
              const status = openStatus(u);
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPickedId(u.id)}
                  style={{ ...selectableCard(on), position: 'relative', flexDirection: 'column', gap: 6, paddingRight: on ? 48 : 18 }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{u.name}</span>
                    <span style={{ fontSize: 13, color: color.muted, whiteSpace: 'nowrap' }}>
                      {u.distanceKm.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} km
                    </span>
                  </span>
                  <span style={{ fontSize: 13, color: color.muted }}>{u.address}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: status.open ? color.open : color.subtle }} />
                    {status.label}
                  </span>
                  {u.nextFreeSlot && (
                    <span style={{ ...pill('gold'), border: 'none', background: color.surfaceRaised, fontSize: 12, padding: '4px 10px' }}>
                      {nextFreeLabel(u.nextFreeSlot)}
                    </span>
                  )}
                  {on && (
                    <span style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: 11, background: color.accent, color: color.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      <CheckOutlined />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Screen>

      <ActionBar>
        <button
          type="button"
          disabled={!pickedUnit || updateCustomer.isPending}
          onClick={confirm}
          style={{ ...primaryButton, flexGrow: 1, minHeight: 56, borderRadius: 16, fontSize: 16, ...((!pickedUnit || updateCustomer.isPending) && disabledButton) }}
        >
          {pickedUnit ? `Agendar na ${pickedUnit.name}` : 'Escolha uma unidade'}
        </button>
      </ActionBar>
    </>
  );
}
