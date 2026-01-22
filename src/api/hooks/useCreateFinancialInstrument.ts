import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreateFinancialInstrumentRequest, FinancialInstrument, schemas } from '../generated';

export function useCreateFinancialInstrument() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFinancialInstrumentRequest) => {
      const response = await apiRequest<FinancialInstrument>(
        '/financialInstrument',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token: token!,
        }
      );

      return schemas.FinancialInstrument.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-instruments'] });
    },
  });
}
