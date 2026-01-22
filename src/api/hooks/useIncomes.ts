import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ListIncomesFilters, Income, schemas } from '../generated';

export function useIncomes(filters: ListIncomesFilters) {
  const { token } = useAuth();

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
    enabled: !!token,
  });
}
