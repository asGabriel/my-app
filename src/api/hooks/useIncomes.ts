import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DateRangeRequest, 
  IncomeListResponse, 
  IncomeListResponseSchema 
} from '../generated';

export function useIncomes(params: DateRangeRequest) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['incomes', params],
    queryFn: async () => {
      const data = await apiRequest<IncomeListResponse>(
        '/financeManager/income/list',
        {
          method: 'POST',
          body: JSON.stringify(params),
          token: token || undefined,
        }
      );

      return IncomeListResponseSchema.parse(data);
    },
  });
}
