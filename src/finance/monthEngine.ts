/**
 * Motor de cálculo do "Controle Mensal" — deriva, a partir dos dados reais da
 * API (Debt, Recurrence, Income), a mesma visão de regime de caixa mensal do
 * protótipo Claude Design ("Controle Mensal v2"): quanto sai/saiu da conta em
 * cada mês, quebra por tipo (fixo/variável/parcelado), por categoria, e
 * projeção dos próximos meses.
 *
 * `Debt` (débitos avulsos/recorrentes materializados e parcelas) já vem do
 * módulo `finance` (rust-api) via `useFinanceDebts`. `Recurrence` e `Income`
 * ainda não têm rota no backend — seguem vindo do mock (ver
 * `FinanceMonthContext`) até o backend ganhar renda e recorrência.
 *
 * Limitações conhecidas do modelo de dados (ver rust-api):
 * - O módulo `finance` não tem instrumento financeiro (cartão/conta) — nem
 *   na dívida nem no pagamento. Por isso não há aqui um agrupamento "fatura
 *   do cartão" como no protótipo: cada débito/parcela aparece como seu
 *   próprio lançamento.
 * - `Recurrence` só é materializada em `Debt` para o mês corrente, por um
 *   job que roda mês a mês (`generate_current_recurrences`). Para meses
 *   futuros ainda não gerados, projetamos a ocorrência a partir da regra
 *   da recorrência (só existe recorrência "fixa" no backend).
 * - Pagamento (`POST /finance/payment`) só existe para `Debt` real: toda
 *   `Occurrence` derivada de um débito/parcela é `payable`; as projetadas de
 *   `Recurrence` não (ainda não viraram dívida). A dívida-pai de um
 *   parcelamento nunca vira ocorrência — só as parcelas são pagáveis.
 */
import dayjs from 'dayjs';
import { schemas, type Debt } from '../api';
import type { Recurrence, Income } from './mock';
import type { DebtCategory } from '../utils/constants';
import { debtAmounts, installmentCountOf, isInstallment, isInstallmentParent, isSettled, parentOf } from './debt';

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
  /** Débito real (permite ver detalhe). Ausente quando `projected`. */
  debtId?: string;
  installmentId?: number;
  installmentCount?: number;
  /** true = sintetizado a partir de uma Recurrence ainda não gerada como Debt. */
  projected: boolean;
  recurrenceId?: string;
  /** true = dá para registrar pagamento por aqui (há um `Debt` real por trás;
   * ver nota no topo do arquivo). Quitação é checada à parte via `isPaid`. */
  payable: boolean;
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

function isDueIn(dueDate: string | null | undefined, year: number, month0: number): boolean {
  if (!dueDate) return false;
  const due = dayjs(dueDate);
  return due.year() === year && due.month() === month0;
}

/**
 * Débitos avulsos/recorrentes-materializados que caem no mês — dívidas de
 * nível-topo (sem `parentId`) e sem parcelamento. As filhas de um
 * parcelamento (`parentId` preenchido) são tratadas à parte, em
 * `occurrencesFromInstallments`.
 */
function occurrencesFromDebts(debts: Debt[], year: number, month0: number): Occurrence[] {
  return debts
    .filter((d) => !isInstallment(d) && !isInstallmentParent(d))
    .filter((d) => isDueIn(d.dueDate, year, month0))
    .map((d) => ({
      key: `debt-${d.id}`,
      kind: (d.expenseType === schemas.ExpenseType.enum.FIXED ? 'fixo' : 'variavel') as OccKind,
      name: d.description,
      category: toCategory(d.category),
      amount: debtAmounts(d).total,
      paidAmount: debtAmounts(d).paid,
      isPaid: isSettled(d),
      dueDay: dayjs(d.dueDate).date(),
      debtId: d.id,
      projected: false,
      payable: true,
    }));
}

/**
 * Parcelas (dívidas-filhas, `parentId` preenchido) que vencem no mês. Uma
 * filha copia description/categoria do pai na criação (ver rust-api
 * `Debt::generate_installment_children`), mas o total de parcelas vem do
 * pai (ver `installmentCountOf`). Só o pai sabe também o total ainda em aberto
 * do parcelamento inteiro (`remainingAmount`), consultado à parte quando
 * necessário (ver `DetailSheet`).
 */
function occurrencesFromInstallments(
  children: Debt[],
  parentsById: Map<string, Debt>,
  year: number,
  month0: number
): Occurrence[] {
  return children
    .filter((d) => isDueIn(d.dueDate, year, month0))
    .map((d) => ({
      key: `debt-${d.id}`,
      kind: 'parcelado' as OccKind,
      name: d.description,
      category: toCategory(d.category),
      amount: debtAmounts(d).total,
      paidAmount: debtAmounts(d).paid,
      isPaid: isSettled(d),
      dueDay: dayjs(d.dueDate).date(),
      debtId: d.id,
      installmentId: d.installmentNumber ?? undefined,
      installmentCount: installmentCountOf(d, parentOf(d, parentsById)),
      projected: false,
      payable: true,
    }));
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
          !isInstallmentParent(d) &&
          d.description === r.description &&
          d.expenseType === schemas.ExpenseType.enum.FIXED &&
          Math.abs(debtAmounts(d).total - parseFloat(r.amount)) < 0.005
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
        payable: false,
        recurrenceId: r.id,
      };
    });
}

export function buildMonthOccurrences(
  year: number,
  month0: number,
  data: { debts: Debt[]; parentsById: Map<string, Debt>; recurrences: Recurrence[] }
): Occurrence[] {
  const singles = data.debts.filter((d) => !isInstallment(d));
  const children = data.debts.filter(isInstallment);
  const singlesThisMonth = singles.filter((d) => isDueIn(d.dueDate, year, month0));

  const fromDebts = occurrencesFromDebts(singles, year, month0);
  const fromInstallments = occurrencesFromInstallments(children, data.parentsById, year, month0);
  const fromRecurrences = occurrencesFromRecurrences(data.recurrences, singlesThisMonth, year, month0);

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
