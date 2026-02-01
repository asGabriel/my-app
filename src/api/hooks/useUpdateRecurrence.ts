import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { schemas } from '../generated';

type UpdateRecurrenceRequest = typeof schemas.UpdateRecurrenceRequest._type;
type Recurrence = typeof schemas.Recurrence._type;

interface UpdateRecurrenceParams {
  recurrenceId: string;
  data: UpdateRecurrenceRequest;
}

export function useUpdateRecurrence() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recurrenceId, data }: UpdateRecurrenceParams) => {
      if (!token) throw new Error('Not authenticated');

      const response = await apiRequest<Recurrence>(
        `/debt/recurrence/${recurrenceId}`,
        {
          method: 'PATCH',
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
