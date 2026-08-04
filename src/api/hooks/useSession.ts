import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Session } from '../inferredTypes';

export function useSession(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'sessions', sessionId],
    queryFn: async () => {
      const data = await matchmakingRequest<Session>(`/sessions/${sessionId}`, {
        method: 'GET',
      });

      return schemas.Session.parse(data);
    },
    enabled: !!sessionId && enabled,
  });
}
