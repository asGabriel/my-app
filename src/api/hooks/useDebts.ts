import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { schemas } from '../generated';
import type { Debt, DebtFilters } from '../inferredTypes';

export function useDebts(filters: DebtFilters, enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['debts', filters],
    queryFn: async () => {
      const data = await apiRequest<Debt[]>(
        '/debt/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return schemas.Debt.array().parse(data);
    },
    enabled: !!token && enabled,
  });
}
