import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import type { Service } from '../mock';

dayjs.locale('pt-br');

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatMoney = (cents: number) => BRL.format(cents / 100);

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** "Sex" — dia da semana abreviado, capitalizado e sem o ponto do locale. */
export const weekdayShort = (date: string | dayjs.Dayjs) => {
  const s = dayjs(date).format('ddd').replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "Sex, 10 out" */
export const formatDay = (date: string | dayjs.Dayjs) => `${weekdayShort(date)}, ${dayjs(date).format('D MMM').replace('.', '')}`;

/** "hoje", "amanhã", "em 3 dias", "há 2 dias" */
export function relativeDay(date: string) {
  const diff = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'ontem';
  return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const servicesLabel = (serviceIds: string[], services: Service[] | undefined) =>
  serviceIds.map((id) => services?.find((s) => s.id === id)?.name ?? '…').join(' + ');

export function greeting() {
  const hour = dayjs().hour();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
