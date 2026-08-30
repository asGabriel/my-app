import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Team } from '../inferredTypes';

/** Forms the opening `Draft` teams for a session with no matches yet. */
export function useSeedQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await matchmakingRequest<Team[]>(`/sessions/${sessionId}/queue/seed`, {
        method: 'POST',
      });

      return schemas.Team.array().parse(response);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', sessionId] });
    },
  });
}
