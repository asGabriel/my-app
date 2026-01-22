import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { UpdateDebtRequest, Debt, schemas } from '../generated';

interface UpdateDebtParams {
  debtId: string;
  data: UpdateDebtRequest;
}

export function useUpdateDebt() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debtId, data }: UpdateDebtParams) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await apiRequest<Debt>(
        `/debt/${debtId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          token,
        }
      );

      return schemas.Debt.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
    },
  });
}
