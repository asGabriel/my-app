import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateDebtRequest } from '../inferredTypes';

export function useCreateFinanceDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDebtRequest) => {
      const response = await financeRequest<unknown>('/debt', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Debt.parse(response);
    },
    // Um parcelamento gera o pai e as parcelas, e um valor pago na criação
    // gera um pagamento, então invalida as listagens de dívidas e pagamentos.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'debts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'payments'] });
    },
  });
}
