import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Match } from '../inferredTypes';

export function useMatches(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'matches', sessionId],
    queryFn: async () => {
      const data = await matchmakingRequest<Match[]>(`/matches/${sessionId}`, {
        method: 'GET',
      });

      return schemas.Match.array().parse(data);
    },
    enabled: !!sessionId && enabled,
  });
}
