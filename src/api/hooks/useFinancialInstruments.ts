import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FinancialInstrumentListFilters, FinancialInstrument, schemas } from '../generated';

export function useFinancialInstruments(filters: FinancialInstrumentListFilters = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['financial-instruments', filters],
    queryFn: async () => {
      const data = await apiRequest<FinancialInstrument[]>(
        '/financialInstrument/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return schemas.FinancialInstrument.array().parse(data);
    },
    enabled: !!token,
  });
}
