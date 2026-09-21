/**
 * Motor de cálculo do "Controle Mensal" — deriva, a partir dos dados reais da
 * API (Debt, Installment, Recurrence, Income), a mesma visão de regime de
 * caixa mensal do protótipo Claude Design ("Controle Mensal v2"): quanto
 * sai/saiu da conta em cada mês, quebra por tipo (fixo/variável/parcelado),
 * por categoria, e projeção dos próximos meses.
 *
 * Limitações conhecidas do modelo de dados (ver rust-api):
 * - `Debt` não guarda o instrumento financeiro (cartão/conta) antes do
 *   pagamento — só `Payment.accountId` sabe de onde saiu, e só depois de
 *   pago. Por isso não há aqui um agrupamento "fatura do cartão" como no
 *   protótipo: cada débito/parcela aparece como seu próprio lançamento.
 * - `Recurrence` só é materializada em `Debt` para o mês corrente, por um
 *   job que roda mês a mês (`generate_current_recurrences`). Para meses
 *   futuros ainda não gerados, projetamos a ocorrência a partir da regra
 *   da recorrência (só existe recorrência "fixa" no backend).
 */
import dayjs from 'dayjs';
import type { Debt, Installment, Recurrence, Income } from './mock';
import { schemas } from '../api';
import type { DebtCategory } from '../utils/constants';

export type OccKind = 'fixo' | 'variavel' | 'parcelado';

export const KIND_LABELS: Record<OccKind, string> = {
  fixo: 'recorrente fixo',
  variavel: 'recorrente variável',
  parcelado: 'parcelado',
};

export interface Occurrence {
  /** Estável dentro do mês; usado como React key. */
  key: string;
  kind: OccKind;
  name: string;
  category: DebtCategory;
  amount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDay: number;
  /** Débito real (permite pagar/ver detalhe). Ausente quando `projected`. */
  debtId?: string;
  installmentId?: number;
  installmentCount?: number;
  /** true = sintetizado a partir de uma Recurrence ainda não gerada como Debt. */
  projected: boolean;
  recurrenceId?: string;
}

export interface MonthTotals {
  total: number;
  fixos: number;
  variaveis: number;
  parcelas: number;
  nFix: number;
  nVar: number;
  nParc: number;
  saiu: number;
  vaiSair: number;
  renda: number;
  livre: number;
}

export function monthKey(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}`;
}

export function monthIndex(year: number, month0: number): number {
  return year * 12 + month0;
}

function toCategory(value: string | undefined | null): DebtCategory {
  const parsed = schemas.DebtCategory.safeParse(value);
  return parsed.success ? parsed.data : schemas.DebtCategory.enum.UNKNOWN;
}

function hasRealInstallments(debt: Debt): boolean {
  return typeof debt.installmentCount === 'number' && debt.installmentCount >= 1;
}

/** Débitos avulsos/recorrentes-materializados que caem no mês (não-parcelados). */
function occurrencesFromDebts(debts: Debt[], year: number, month0: number): Occurrence[] {
  return debts
    .filter((d) => !hasRealInstallments(d))
    .filter((d) => {
      const due = dayjs(d.dueDate);
      return due.year() === year && due.month() === month0;
    })
    .map((d) => ({
      key: `debt-${d.id}`,
      kind: (d.expenseType === 'FIXED' ? 'fixo' : 'variavel') as OccKind,
      name: d.description,
      category: toCategory(d.category),
      amount: parseFloat(d.totalAmount),
      paidAmount: parseFloat(d.paidAmount),
      isPaid: d.status === 'SETTLED',
      dueDay: dayjs(d.dueDate).date(),
      debtId: d.id,
      projected: false,
    }));
}

/** Parcelas (de débitos parcelados) que vencem no mês. */
function occurrencesFromInstallments(
  installments: Installment[],
  debtsById: Map<string, Debt>,
  year: number,
  month0: number
): Occurrence[] {
  return installments
    .filter((i) => {
      const due = dayjs(i.dueDate);
      return due.year() === year && due.month() === month0;
    })
    .map((i) => {
      const parent = debtsById.get(i.debtId);
      const amount = parseFloat(i.amount);
      return {
        key: `inst-${i.debtId}-${i.installmentId}`,
        kind: 'parcelado' as OccKind,
        name: parent?.description ?? 'Parcela',
        category: toCategory(parent?.category),
        amount,
        paidAmount: i.isPaid ? amount : 0,
        isPaid: i.isPaid,
        dueDay: dayjs(i.dueDate).date(),
        debtId: i.debtId,
        installmentId: i.installmentId,
        installmentCount: parent?.installmentCount ?? undefined,
        projected: false,
      };
    });
}

/**
 * Ocorrências de recorrências ainda não materializadas em Debt para o mês
 * (tipicamente meses futuros — o job de geração só roda para o mês corrente).
 * Evita duplicar quando já existe um Debt real equivalente nesse mês.
 */
function occurrencesFromRecurrences(
  recurrences: Recurrence[],
  realDebtsThisMonth: Debt[],
  year: number,
  month0: number
): Occurrence[] {
  const daysInMonth = dayjs(new Date(year, month0, 1)).daysInMonth();

  return recurrences
    .filter((r) => r.active)
    .filter((r) => {
      const day = Math.min(Math.max(r.dayOfMonth, 1), daysInMonth);
      const due = dayjs(new Date(year, month0, day));
      if (due.isBefore(dayjs(r.startDate), 'day')) return false;
      if (r.endDate && due.isAfter(dayjs(r.endDate), 'day')) return false;
      return true;
    })
    .filter((r) => {
      // já foi materializada como Debt este mês?
      const already = realDebtsThisMonth.some(
        (d) =>
          !hasRealInstallments(d) &&
          d.description === r.description &&
          d.expenseType === 'FIXED' &&
          Math.abs(parseFloat(d.totalAmount) - parseFloat(r.amount)) < 0.005
      );
      return !already;
    })
    .map((r) => {
      const day = Math.min(Math.max(r.dayOfMonth, 1), daysInMonth);
      return {
        key: `rec-${r.id}-${monthKey(year, month0)}`,
        kind: 'fixo' as OccKind,
        name: r.description,
        category: toCategory(r.category),
        amount: parseFloat(r.amount),
        paidAmount: 0,
        isPaid: false,
        dueDay: day,
        projected: true,
        recurrenceId: r.id,
      };
    });
}

export function buildMonthOccurrences(
  year: number,
  month0: number,
  data: { debts: Debt[]; installments: Installment[]; debtsById: Map<string, Debt>; recurrences: Recurrence[] }
): Occurrence[] {
  const debtsThisMonth = data.debts.filter((d) => {
    const due = dayjs(d.dueDate);
    return due.year() === year && due.month() === month0;
  });
  const fromDebts = occurrencesFromDebts(data.debts, year, month0);
  const fromInstallments = occurrencesFromInstallments(data.installments, data.debtsById, year, month0);
  const fromRecurrences = occurrencesFromRecurrences(data.recurrences, debtsThisMonth, year, month0);

  return [...fromDebts, ...fromInstallments, ...fromRecurrences].sort((a, b) => a.dueDay - b.dueDay);
}

export function computeIncomeForMonth(incomes: Income[], year: number, month0: number): number {
  return incomes
    .filter((i) => {
      const ref = dayjs(i.reference);
      return ref.year() === year && ref.month() === month0;
    })
    .reduce((sum, i) => sum + parseFloat(i.amount), 0);
}

export function computeMonthTotals(occurrences: Occurrence[], renda: number): MonthTotals {
  const t: MonthTotals = {
    total: 0, fixos: 0, variaveis: 0, parcelas: 0,
    nFix: 0, nVar: 0, nParc: 0,
    saiu: 0, vaiSair: 0, renda, livre: 0,
  };
  for (const o of occurrences) {
    t.total += o.amount;
    if (o.kind === 'fixo') { t.fixos += o.amount; t.nFix++; }
    else if (o.kind === 'variavel') { t.variaveis += o.amount; t.nVar++; }
    else { t.parcelas += o.amount; t.nParc++; }
    t.saiu += Math.min(o.amount, o.paidAmount);
  }
  t.vaiSair = t.total - t.saiu;
  t.livre = renda - t.total;
  return t;
}

export interface CategorySlice {
  category: DebtCategory;
  amount: number;
  pct: number;
}

export function computeCategoryBreakdown(occurrences: Occurrence[]): CategorySlice[] {
  const map = new Map<DebtCategory, number>();
  for (const o of occurrences) map.set(o.category, (map.get(o.category) ?? 0) + o.amount);
  const max = Math.max(1, ...map.values());
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, pct: Math.round((amount / max) * 100) }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MixSlice {
  kind: OccKind;
  label: string;
  amount: number;
  pct: number;
}

const MIX_LABELS: Record<OccKind, string> = { fixo: 'Fixos', variavel: 'Variáveis', parcelado: 'Parcelas' };

export function computeMix(totals: MonthTotals): MixSlice[] {
  const raw: [OccKind, number][] = [
    ['fixo', totals.fixos],
    ['variavel', totals.variaveis],
    ['parcelado', totals.parcelas],
  ];
  return raw
    .filter(([, v]) => v > 0)
    .map(([kind, amount]) => ({
      kind,
      label: MIX_LABELS[kind],
      amount,
      pct: totals.total > 0 ? Math.round((amount / totals.total) * 100) : 0,
    }));
}

/** Débitos parcelados ainda ativos (não quitados) que têm ocorrência no mês. */
export function activeInstallmentDebts(occurrences: Occurrence[], debtsById: Map<string, Debt>): Debt[] {
  const ids = new Set(occurrences.filter((o) => o.kind === 'parcelado' && o.debtId).map((o) => o.debtId!));
  return Array.from(ids)
    .map((id) => debtsById.get(id))
    .filter((d): d is Debt => !!d && d.status !== 'SETTLED');
}
