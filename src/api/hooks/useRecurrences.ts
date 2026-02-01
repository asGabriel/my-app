import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { RecurrenceFilters, Recurrence, schemas } from '../generated';

export function useRecurrences(filters: RecurrenceFilters) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['recurrences', filters],
    queryFn: async () => {
      const data = await apiRequest<Recurrence[]>(
        '/debt/recurrence/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return schemas.Recurrence.array().parse(data);
    },
    enabled: !!token,
  });
}
