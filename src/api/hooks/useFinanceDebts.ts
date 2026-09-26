import { useQuery } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { DebtFilters } from '../inferredTypes';

export function useFinanceDebts(filters: DebtFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['finance', 'debts', filters],
    queryFn: async () => {
      const data = await financeRequest<unknown>('/debt/list', {
        method: 'POST',
        body: JSON.stringify(filters),
      });

      return schemas.Debt.array().parse(data);
    },
    enabled,
  });
}
