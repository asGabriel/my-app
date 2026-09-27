import { useQuery } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { IncomeFilters } from '../inferredTypes';

export function useFinanceIncomes(filters: IncomeFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['finance', 'incomes', filters],
    queryFn: async () => {
      const data = await financeRequest<unknown>('/income/list', {
        method: 'POST',
        body: JSON.stringify(filters),
      });

      return schemas.Income.array().parse(data);
    },
    enabled,
  });
}
