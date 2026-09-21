import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Session } from '../inferredTypes';

/**
 * Checks a single player out of a session — removes them from the confirmed
 * roster and the waiting queue. Idempotent.
 */
export function useCheckOutPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
      const response = await matchmakingRequest<Session>(
        `/sessions/${sessionId}/check-in/${playerId}`,
        { method: 'DELETE' },
      );

      return schemas.Session.parse(response);
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', sessionId] });
    },
  });
}
