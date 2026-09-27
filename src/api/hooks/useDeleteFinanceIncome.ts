import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';

/** Exclui (soft delete) uma receita. */
export function useDeleteFinanceIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ incomeId }: { incomeId: string }) => {
      await financeRequest<void>(`/income/${incomeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'incomes'] });
    },
  });
}
