import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { QueueEntry } from '../inferredTypes';

export function useSessionQueue(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'queue', sessionId],
    queryFn: async () => {
      const data = await matchmakingRequest<QueueEntry[]>(`/sessions/${sessionId}/queue`, {
        method: 'GET',
      });

      return schemas.QueueEntry.array().parse(data);
    },
    enabled: !!sessionId && enabled,
  });
}
