import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';

/** Estorna um pagamento — o valor volta a ficar em aberto na dívida (e no pai, se parcela). */
export function useRefundFinancePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId }: { paymentId: string }) => {
      await financeRequest<void>(`/payment/${paymentId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'debts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
    },
  });
}
