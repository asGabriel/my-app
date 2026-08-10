import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Session } from '../inferredTypes';

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'sessions'],
    queryFn: async () => {
      const data = await matchmakingRequest<Session[]>('/sessions', {
        method: 'GET',
      });

      return schemas.Session.array().parse(data);
    },
    enabled,
  });
}
