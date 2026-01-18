import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ListIncomesFilters, 
  IncomeListResponse, 
  IncomeListResponseSchema 
} from '../generated';

export function useIncomes(filters: ListIncomesFilters) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['incomes', filters],
    queryFn: async () => {
      const data = await apiRequest<IncomeListResponse>(
        '/income/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token || undefined,
        }
      );

      return IncomeListResponseSchema.parse(data);
    },
  });
}
