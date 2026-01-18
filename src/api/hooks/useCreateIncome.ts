import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreateIncomeRequest, IncomeResponse, IncomeResponseSchema } from '../generated';

export function useCreateIncome() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncomeRequest) => {
      const response = await apiRequest<IncomeResponse>(
        '/income',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token: token || undefined,
        }
      );

      return IncomeResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}
