import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CourtSuggestion } from '../inferredTypes';

/**
 * Re-runs the idle-court challenger fill without a result to react to — for
 * courts stuck `missingChallenger` with no match running.
 */
export function useFillCourts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await matchmakingRequest<CourtSuggestion[]>(
        `/sessions/${sessionId}/queue/fill`,
        { method: 'POST' },
      );

      return schemas.CourtSuggestion.array().parse(response);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', sessionId] });
    },
  });
}
