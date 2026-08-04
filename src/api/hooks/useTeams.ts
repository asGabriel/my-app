import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Team } from '../inferredTypes';

export function useTeams(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'teams', sessionId],
    queryFn: async () => {
      const data = await matchmakingRequest<Team[]>(`/teams/${sessionId}`, {
        method: 'GET',
      });

      return schemas.Team.array().parse(data);
    },
    enabled: !!sessionId && enabled,
  });
}
