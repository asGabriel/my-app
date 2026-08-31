import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { QueueEntry } from '../inferredTypes';

/** Pins / unpins a queued player (manual priority — jumps the front). */
export function usePinQueuePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      playerId,
      pinned,
    }: {
      sessionId: string;
      playerId: string;
      pinned: boolean;
    }) => {
      const response = await matchmakingRequest<QueueEntry>(
        `/sessions/${sessionId}/queue/${playerId}`,
        { method: 'PATCH', body: JSON.stringify({ pinned }) },
      );

      return schemas.QueueEntry.parse(response);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', variables.sessionId] });
    },
  });
}
