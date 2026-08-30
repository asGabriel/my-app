import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';

/** Discards a `Draft` that was never started — its players return to the queue. */
export function useDiscardDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId }: { teamId: string; sessionId: string }) => {
      await matchmakingRequest<void>(`/teams/${teamId}`, { method: 'DELETE' });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', variables.sessionId] });
    },
  });
}
