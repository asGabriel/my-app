import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ListPaymentsFilters, 
  PaymentListResponse, 
  PaymentListResponseSchema 
} from '../generated';

export function usePayments(filters: ListPaymentsFilters) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const data = await apiRequest<PaymentListResponse>(
        '/payment/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token || undefined,
        }
      );

      return PaymentListResponseSchema.parse(data);
    },
  });
}
