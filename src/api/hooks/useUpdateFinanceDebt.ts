import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { UpdateDebtRequest } from '../inferredTypes';

interface UpdateFinanceDebtParams {
  debtId: string;
  data: UpdateDebtRequest;
}

export function useUpdateFinanceDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debtId, data }: UpdateFinanceDebtParams) => {
      const response = await financeRequest<unknown>(`/debt/${debtId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return schemas.Debt.parse(response);
    },
    // Editar o pai pode mudar as parcelas junto (ex.: listId), então
    // invalida toda listagem de dívidas.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'debts'] });
    },
  });
}
