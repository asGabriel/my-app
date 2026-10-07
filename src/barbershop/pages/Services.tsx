import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useBooking } from '../BookingContext';
import { ACTION_BAR_SPACE, ActionBar, ActionSummary } from '../components/ActionBar';
import { BackHeader } from '../components/BackHeader';
import { Loading } from '../components/Loading';
import { Screen } from '../layouts/Layouts';
import { useServices, type ServiceCategory } from '../mock';
import { formatDuration, formatMoney, plural } from '../shared/format';
import { color, disabledButton, displayTitle, pill, plainButton, primaryButton, selectableCard } from '../shared/theme';

const TABS: { key: ServiceCategory | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'cabelo', label: 'Cabelo' },
  { key: 'barba', label: 'Barba' },
  { key: 'combos', label: 'Combos' },
];

/** Passo 1 do agendamento: um ou mais serviços. */
export function Services() {
  const navigate = useNavigate();
  const { draft, update } = useBooking();
  const { data: services } = useServices();
  const [tab, setTab] = useState<ServiceCategory | 'todos'>('todos');

  const picked = draft.serviceIds;
  const toggle = (id: string) =>
    update({ serviceIds: picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id] });
  const total = picked.reduce((sum, id) => sum + (services?.find((s) => s.id === id)?.priceCents ?? 0), 0);

  return (
    <>
      <Screen bottomSpace={ACTION_BAR_SPACE} gap={20}>
        <BackHeader to="/" caption="Passo 1 de 3" />
        <h1 style={displayTitle}>Escolha o serviço</h1>
        <div role="tablist" aria-label="Categorias" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                style={{
                  ...plainButton,
                  minHeight: 36,
                  padding: '0 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  ...(on
                    ? { background: color.ink, color: color.onAccent }
                    : { border: `1px solid ${color.line}`, color: color.muted }),
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {!services ? (
          <Loading />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {services
              .filter((s) => tab === 'todos' || s.category === tab)
              .map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} onClick={() => toggle(s.id)} style={selectableCard(on)}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: color.muted }}>{s.description}</span>
                      <span style={{ fontSize: 13, color: color.muted }}>{formatDuration(s.durationMin)}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{formatMoney(s.priceCents)}</span>
                      {s.includedInClub && <span style={pill('gold')}>Incluso no Clube</span>}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </Screen>

      <ActionBar>
        <ActionSummary
          label={picked.length ? `${plural(picked.length, 'serviço selecionado', 'serviços selecionados')}` : 'Nenhum serviço selecionado'}
          value={formatMoney(total)}
        />
        <button
          type="button"
          disabled={!picked.length}
          onClick={() => navigate('/agendar/horario')}
          style={{ ...primaryButton, ...(!picked.length && disabledButton) }}
        >
          Continuar
        </button>
      </ActionBar>
    </>
  );
}
