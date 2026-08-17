import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateMatchRequest, Match } from '../inferredTypes';

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMatchRequest) => {
      const response = await matchmakingRequest<Match>('/matches', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Match.parse(response);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'matches', variables.sessionId] });
      // Opening a match flips both teams to PLAYING via a DB trigger, so the
      // teams query must be refetched too — otherwise the queue derived from
      // stale team data keeps offering the same teams for the next match.
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', variables.sessionId] });
    },
  });
}
