import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FinancialInstrumentListFilters, 
  FinancialInstrumentListResponse, 
  FinancialInstrumentListResponseSchema 
} from '../generated';

export function useFinancialInstruments(filters: FinancialInstrumentListFilters = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['financial-instruments', filters],
    queryFn: async () => {
      const data = await apiRequest<FinancialInstrumentListResponse>(
        '/financialInstrument/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return FinancialInstrumentListResponseSchema.parse(data);
    },
    enabled: !!token,
  });
}
