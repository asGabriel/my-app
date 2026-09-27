import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { UpdateIncomeRequest } from '../inferredTypes';

interface UpdateFinanceIncomeParams {
  incomeId: string;
  data: UpdateIncomeRequest;
}

export function useUpdateFinanceIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ incomeId, data }: UpdateFinanceIncomeParams) => {
      const response = await financeRequest<unknown>(`/income/${incomeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return schemas.Income.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'incomes'] });
    },
  });
}
