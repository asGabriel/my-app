import { useQuery } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';
import type { PaymentFilters } from '../inferredTypes';

export function useFinancePayments(filters: PaymentFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['finance', 'payments', filters],
    queryFn: async () => {
      const data = await financeRequest<unknown>('/payment/list', {
        method: 'POST',
        body: JSON.stringify(filters),
      });

      return schemas.Payment.array().parse(data);
    },
    enabled,
  });
}
