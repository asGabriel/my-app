import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CreateRecurrenceRequest, Recurrence, schemas } from '../generated';

export function useCreateRecurrence() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecurrenceRequest) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await apiRequest<Recurrence>(
        '/debt/recurrence',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }
      );

      return schemas.Recurrence.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrences'] });
    },
  });
}
