import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateIncomeRequest } from '../inferredTypes';

export function useCreateFinanceIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncomeRequest) => {
      const response = await financeRequest<unknown>('/income', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Income.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'incomes'] });
    },
  });
}
