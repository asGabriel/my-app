import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateSessionRequest, Session } from '../inferredTypes';

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionRequest) => {
      const response = await matchmakingRequest<Session>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Session.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'sessions'] });
    },
  });
}
