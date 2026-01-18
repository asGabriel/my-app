import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DateRangeRequest, 
  ExpenseListResponse, 
  ExpenseListResponseSchema 
} from '../generated';

export function useExpenses(params: DateRangeRequest) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const data = await apiRequest<ExpenseListResponse>(
        '/financeManager/expense/list',
        {
          method: 'POST',
          body: JSON.stringify(params),
          token: token || undefined,
        }
      );

      return ExpenseListResponseSchema.parse(data);
    },
  });
}
