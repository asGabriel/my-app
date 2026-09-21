import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Session } from '../inferredTypes';

/**
 * Checks a single player into a session — adds them to the confirmed roster and
 * the waiting queue, so they become eligible for court draws. Idempotent.
 */
export function useCheckInPlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
      const response = await matchmakingRequest<Session>(
        `/sessions/${sessionId}/check-in/${playerId}`,
        { method: 'POST' },
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
