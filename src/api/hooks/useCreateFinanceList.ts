import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateDebtListRequest } from '../inferredTypes';

export function useCreateFinanceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDebtListRequest) => {
      const response = await financeRequest<unknown>('/list', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.DebtList.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'lists'] });
    },
  });
}
