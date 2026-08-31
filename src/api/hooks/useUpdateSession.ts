import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { UpdateSessionRequest, Session } from '../inferredTypes';

interface UpdateSessionParams {
  sessionId: string;
  data: UpdateSessionRequest;
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, data }: UpdateSessionParams) => {
      const response = await matchmakingRequest<Session>(`/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return schemas.Session.parse(response);
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', sessionId] });
    },
  });
}
