import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { useFinanceDebtParents, useFinanceDebts, type Debt } from '../api';
import { useRecurrences, useIncomes } from './mock';
import {
  buildMonthOccurrences,
  computeIncomeForMonth,
  computeMonthTotals,
  monthKey,
  type MonthTotals,
  type Occurrence,
} from './monthEngine';

const MONTHS_BACK_CHIP = 3;
const MONTHS_FORWARD_CHIP = 6;
/** Janela de busca — mais larga que os chips visíveis, para sobrar histórico
 * (tendência de 6 meses) e projeção a partir de qualquer mês selecionável. */
const FETCH_MONTHS_BACK = 12;
const FETCH_MONTHS_FORWARD = 12;

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export interface MonthOption {
  year: number;
  month0: number;
  isCurrent: boolean;
  chip: string;
}

export type DetailState = { occurrence: Occurrence; year: number; month0: number };
export type PayState = { occurrence: Occurrence; year: number; month0: number };

interface FinanceMonthContextValue {
  months: MonthOption[];
  mi: number;
  setMi: (i: number) => void;
  selected: { year: number; month0: number };
  privado: boolean;
  togglePrivado: () => void;
  isLoading: boolean;
  /** Erro ao buscar os débitos reais (módulo `finance`) — renda/recorrência
   * seguem no mock e não falham. */
  isError: boolean;
  error: unknown;
  refetch: () => void;
  getOccurrences: (year: number, month0: number) => Occurrence[];
  getTotals: (year: number, month0: number) => MonthTotals;
  debtsById: Map<string, Debt>;
  detail: DetailState | null;
  openDetail: (occurrence: Occurrence, year: number, month0: number) => void;
  closeDetail: () => void;
  pay: PayState | null;
  openPay: (occurrence: Occurrence, year: number, month0: number) => void;
  closePay: () => void;
}

const FinanceMonthContext = createContext<FinanceMonthContextValue | null>(null);

export function FinanceMonthProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => dayjs(), []);
  const [mi, setMi] = useState(MONTHS_BACK_CHIP);
  const [privado, setPrivado] = useState(false);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [pay, setPay] = useState<PayState | null>(null);

  const months: MonthOption[] = useMemo(() => {
    const list: MonthOption[] = [];
    for (let i = -MONTHS_BACK_CHIP; i <= MONTHS_FORWARD_CHIP; i++) {
      const d = today.add(i, 'month');
      list.push({
        year: d.year(),
        month0: d.month(),
        isCurrent: i === 0,
        chip: MESES_CURTOS[d.month()] + (i === -MONTHS_BACK_CHIP || d.month() === 0 ? ` ${String(d.year()).slice(2)}` : ''),
      });
    }
    return list;
  }, [today]);

  const selected = months[mi] ?? months[MONTHS_BACK_CHIP];

  const windowStart = useMemo(() => today.startOf('month').subtract(FETCH_MONTHS_BACK, 'month'), [today]);
  const windowEnd = useMemo(() => today.startOf('month').add(FETCH_MONTHS_FORWARD, 'month').endOf('month'), [today]);
  const dateFilters = useMemo(
    () => ({ startDate: windowStart.format('YYYY-MM-DD'), endDate: windowEnd.format('YYYY-MM-DD') }),
    [windowStart, windowEnd]
  );

  // Débitos avulsos/recorrentes-materializados e parcelas (filhas) que vencem
  // na janela — numa única chamada, como já faz o resto do Controle Mensal
  // (ParcelasTab, DebtsTab). Com filtro de data o backend não devolve os pais
  // de parcelamento (due_date nulo neles), então eles vêm numa 2ª request.
  const monthFilters = useMemo(() => ({ includeChildren: true, ...dateFilters }), [dateFilters]);
  const { data: windowDebts, isLoading: isLoadingDebts, isError: isDebtsError, error: debtsError, refetch: refetchDebts } =
    useFinanceDebts(monthFilters);
  const { data: recurrences, isLoading: isLoadingRecurrences } = useRecurrences({ active: true });
  const { data: incomes, isLoading: isLoadingIncomes } = useIncomes(dateFilters);

  const { parents } = useFinanceDebtParents(windowDebts);

  const debtsById = useMemo(() => {
    const map = new Map<string, Debt>();
    windowDebts?.forEach((d) => map.set(d.id, d));
    parents?.forEach((d) => map.set(d.id, d));
    return map;
  }, [windowDebts, parents]);

  const occurrencesByMonth = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    if (!windowDebts || !recurrences) return map;
    let cursor = windowStart;
    while (cursor.isBefore(windowEnd) || cursor.isSame(windowEnd, 'month')) {
      const key = monthKey(cursor.year(), cursor.month());
      map.set(
        key,
        buildMonthOccurrences(cursor.year(), cursor.month(), {
          debts: windowDebts,
          parentsById: debtsById,
          recurrences,
        })
      );
      cursor = cursor.add(1, 'month');
    }
    return map;
  }, [windowDebts, debtsById, recurrences, windowStart, windowEnd]);

  const incomeByMonth = useMemo(() => {
    const map = new Map<string, number>();
    if (!incomes) return map;
    let cursor = windowStart;
    let lastKnown = 0;
    while (cursor.isBefore(windowEnd) || cursor.isSame(windowEnd, 'month')) {
      const key = monthKey(cursor.year(), cursor.month());
      const value = computeIncomeForMonth(incomes, cursor.year(), cursor.month());
      // meses futuros sem receita lançada assumem a última renda mensal conhecida
      // (não há conceito de "receita recorrente" no backend hoje).
      if (value > 0) lastKnown = value;
      map.set(key, value > 0 ? value : lastKnown);
      cursor = cursor.add(1, 'month');
    }
    return map;
  }, [incomes, windowStart, windowEnd]);

  const getOccurrences = (year: number, month0: number) => occurrencesByMonth.get(monthKey(year, month0)) ?? [];
  const getTotals = (year: number, month0: number) => {
    const occ = getOccurrences(year, month0);
    const renda = incomeByMonth.get(monthKey(year, month0)) ?? 0;
    return computeMonthTotals(occ, renda);
  };

  const value: FinanceMonthContextValue = {
    months,
    mi,
    setMi,
    selected: { year: selected.year, month0: selected.month0 },
    privado,
    togglePrivado: () => setPrivado((p) => !p),
    isLoading: isLoadingDebts || isLoadingRecurrences || isLoadingIncomes,
    isError: isDebtsError,
    error: debtsError,
    refetch: () => void refetchDebts(),
    getOccurrences,
    getTotals,
    debtsById,
    detail,
    openDetail: (occurrence, year, month0) => setDetail({ occurrence, year, month0 }),
    closeDetail: () => setDetail(null),
    pay,
    openPay: (occurrence, year, month0) => setPay({ occurrence, year, month0 }),
    closePay: () => setPay(null),
  };

  return <FinanceMonthContext.Provider value={value}>{children}</FinanceMonthContext.Provider>;
}

export function useFinanceMonth() {
  const ctx = useContext(FinanceMonthContext);
  if (!ctx) throw new Error('useFinanceMonth must be used within a FinanceMonthProvider');
  return ctx;
}
