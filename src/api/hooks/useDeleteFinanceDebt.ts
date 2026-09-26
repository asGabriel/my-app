import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';

/** Exclui uma dívida — numa dívida-pai, o parcelamento inteiro (parcelas e pagamentos juntos). */
export function useDeleteFinanceDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debtId }: { debtId: string }) => {
      await financeRequest<void>(`/debt/${debtId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'debts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
    },
  });
}
