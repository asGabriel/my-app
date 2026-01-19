import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreatePaymentRequest, PaymentResponse, PaymentResponseSchema } from '../generated';

export function useCreatePayment() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await apiRequest<PaymentResponse>(
        '/payment',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }
      );

      return PaymentResponseSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}
