import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DebtFilters, 
  DebtListResponse, 
  DebtListResponseSchema 
} from '../generated';

export function useDebts(filters: DebtFilters) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['debts', filters],
    queryFn: async () => {
      const data = await apiRequest<DebtListResponse>(
        '/debt/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token || undefined,
        }
      );

      return DebtListResponseSchema.parse(data);
    },
  });
}
