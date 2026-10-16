import { App } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Loading } from '../components/Loading';
import { Screen, TAB_SCREEN_SPACE } from '../layouts/Layouts';
import { useChangeClubPlan, useClubPlans, useCustomer } from '../mock';
import { formatMoney } from '../shared/format';
import { color, disabledButton, displayTitle, eyebrow, font, outlineButton, pill, selectableCard } from '../shared/theme';

export function Club() {
  const { message } = App.useApp();
  const { data: customer } = useCustomer();
  const { data: plans } = useClubPlans();
  const changePlan = useChangeClubPlan();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!customer || !plans) return <Loading />;

  const current = plans.find((p) => p.id === customer.clubPlanId);
  const selected = selectedId ?? current?.id ?? plans[0].id;
  const selectedPlan = plans.find((p) => p.id === selected)!;
  const isCurrent = selected === current?.id;

  const cta = isCurrent ? 'Gerenciar assinatura' : current ? `Trocar para o ${selectedPlan.name}` : `Assinar o ${selectedPlan.name}`;
  const onCta = () => {
    if (isCurrent) {
      message.info('Gerenciamento da assinatura ainda não está disponível.');
      return;
    }
    changePlan.mutate(selected, { onSuccess: () => message.success(`Plano ${selectedPlan.name} ativado`) });
  };

  return (
    <Screen bottomSpace={TAB_SCREEN_SPACE} gap={22}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ ...eyebrow, letterSpacing: '0.24em', color: color.accent }}>Clube Navalha</span>
        <h1 style={displayTitle}>Seu corte em dia, todo mês.</h1>
      </div>

      {current && (
        <section style={{ borderRadius: 20, padding: 20, background: color.surfaceGold, border: `1px solid ${color.lineGold}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Seu plano: {current.name}</span>
            {customer.clubRenewsOn && (
              <span style={{ fontSize: 12, color: color.muted }}>renova em {dayjs(customer.clubRenewsOn).format('D MMM').replace('.', '')}</span>
            )}
          </div>
          {current.monthlyCredits !== null ? (
            <>
              <div
                role="meter"
                aria-label="Créditos usados"
                aria-valuemin={0}
                aria-valuemax={current.monthlyCredits}
                aria-valuenow={customer.clubCreditsUsed}
                style={{ display: 'grid', gridTemplateColumns: `repeat(${current.monthlyCredits}, minmax(0, 1fr))`, gap: 8 }}
              >
                {Array.from({ length: current.monthlyCredits }, (_, i) => (
                  <span key={i} style={{ height: 8, borderRadius: 4, background: i < customer.clubCreditsUsed ? color.accent : color.lineStrong }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: color.muted }}>
                {customer.clubCreditsUsed} de {current.monthlyCredits} créditos usados · vale em todas as unidades
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: color.muted }}>Sem limite de cortes e barbas · vale em todas as unidades</span>
          )}
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={eyebrow}>Planos</span>
        <div role="radiogroup" aria-label="Planos" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected === p.id}
              onClick={() => setSelectedId(p.id)}
              style={{ ...selectableCard(selected === p.id), flexDirection: 'column', gap: 6 }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: font.display, fontSize: 22 }}>{p.name}</span>
                <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {formatMoney(p.priceCents)}
                  <span style={{ fontSize: 12, fontWeight: 500, color: color.muted }}> /mês</span>
                </span>
              </span>
              <span style={{ fontSize: 13, color: color.muted }}>{p.description}</span>
              {p.id === current?.id && <span style={pill('solid')}>Plano atual</span>}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={changePlan.isPending}
        onClick={onCta}
        style={{ ...outlineButton, borderColor: color.accent, color: color.accent, ...(changePlan.isPending && disabledButton) }}
      >
        {cta}
      </button>
    </Screen>
  );
}
