/**
 * Hooks de finance com a mesma assinatura dos que existiam em `src/api/hooks`,
 * mas lendo/escrevendo no store em memória (`./store`). Quando o backend v2
 * voltar a expor as rotas, basta apontar os imports de volta para `../../api`.
 */
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as store from './store';
import type {
  CreateDebtRequest, CreatePaymentRequest, Debt, DebtFilters,
  FinancialInstrument, FinancialInstrumentListFilters, Income, IncomeFilters, Installment,
  InstallmentFilters,
} from './types';

const LATENCY_MS = 120;
const delay = <T,>(value: () => T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value()), LATENCY_MS));

const inRange = (date: string, start?: string, end?: string) =>
  (!start || !dayjs(date).isBefore(dayjs(start), 'day')) && (!end || !dayjs(date).isAfter(dayjs(end), 'day'));

export function useDebts(filters: DebtFilters, enabled = true) {
  return useQuery({
    queryKey: ['debts', filters],
    enabled,
    queryFn: () =>
      delay<Debt[]>(() =>
        store.debts
          .filter((d) => !filters.ids || filters.ids.includes(d.id))
          .filter((d) => !filters.statuses || filters.statuses.includes(d.status))
          .filter((d) => inRange(d.dueDate, filters.startDate, filters.endDate))
          .map((d) => ({ ...d }))
      ),
  });
}

export function useInstallments(filters: InstallmentFilters = {}) {
  return useQuery({
    queryKey: ['installments', filters],
    queryFn: () =>
      delay<Installment[]>(() =>
        store.installments
          .filter((i) => !filters.debtIds || filters.debtIds.includes(i.debtId))
          .filter((i) => filters.isPaid === undefined || i.isPaid === filters.isPaid)
          .filter((i) => inRange(i.dueDate, filters.startDate, filters.endDate))
          .map((i) => ({ ...i }))
      ),
  });
}

export function useIncomes(filters: IncomeFilters = {}) {
  return useQuery({
    queryKey: ['incomes', filters],
    queryFn: () =>
      delay<Income[]>(() =>
        store.incomes.filter((i) => inRange(i.reference, filters.startDate, filters.endDate)).map((i) => ({ ...i }))
      ),
  });
}

export function useFinancialInstruments(filters: FinancialInstrumentListFilters = {}) {
  return useQuery({
    queryKey: ['financial-instruments', filters],
    queryFn: () =>
      delay<FinancialInstrument[]>(() =>
        store.instruments
          .filter((i) => !filters.ids || filters.ids.includes(i.id))
          .filter((i) => !filters.instrumentTypes || (i.instrumentType && filters.instrumentTypes.includes(i.instrumentType)))
          .map((i) => ({ ...i }))
      ),
  });
}

function useInvalidate(keys: string[]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
}

export function useCreateDebt() {
  const invalidate = useInvalidate(['debts', 'installments']);
  return useMutation({
    mutationFn: (req: CreateDebtRequest) => delay(() => store.createDebt(req)),
    onSuccess: invalidate,
  });
}

export function useCreatePayment() {
  const invalidate = useInvalidate(['debts', 'installments']);
  return useMutation({
    mutationFn: (req: CreatePaymentRequest) => delay(() => store.createPayment(req)),
    onSuccess: invalidate,
  });
}
