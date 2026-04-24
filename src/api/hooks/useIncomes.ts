import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { schemas } from '../generated';
import type { ListIncomesFilters, Income } from '../inferredTypes';

type IncomesQueryOptions = Omit<UseQueryOptions<Income[]>, 'queryKey' | 'queryFn'>;

export function useIncomes(filters: ListIncomesFilters, options: IncomesQueryOptions = {}) {
  const { token } = useAuth();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ['incomes', filters],
    queryFn: async () => {
      const data = await apiRequest<Income[]>(
        '/income/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return schemas.Income.array().parse(data);
    },
    ...queryOptions,
    enabled: !!token && enabled,
  });
}
