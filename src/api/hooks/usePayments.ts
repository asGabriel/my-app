import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { schemas } from '../generated';
import type { ListPaymentsFilters, Payment } from '../inferredTypes';

export function usePayments(filters: ListPaymentsFilters, enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const data = await apiRequest<Payment[]>(
        '/payment/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return schemas.Payment.array().parse(data);
    },
    enabled: !!token && enabled,
  });
}
