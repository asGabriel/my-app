import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { schemas } from '../generated';
import type { CreateIncomeRequest, Income } from '../inferredTypes';

export function useCreateIncome() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncomeRequest) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await apiRequest<Income>(
        '/income',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }
      );

      return schemas.Income.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}
