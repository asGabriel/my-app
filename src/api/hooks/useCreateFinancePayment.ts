import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreatePaymentRequest } from '../inferredTypes';

export function useCreateFinancePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      const response = await financeRequest<unknown>('/payment', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Payment.parse(response);
    },
    // Pagar uma parcela também muda o saldo do pai, então invalida toda
    // listagem de dívidas (não só a paga).
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'debts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
    },
  });
}
