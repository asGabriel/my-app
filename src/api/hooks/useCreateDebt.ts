import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreateDebtRequest, DebtResponse, DebtResponseSchema } from '../generated';

export function useCreateDebt() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDebtRequest) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await apiRequest<DebtResponse>(
        '/debt',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }
      );

      return DebtResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}
