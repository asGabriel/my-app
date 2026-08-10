import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Match, ReportMatchResultRequest } from '../inferredTypes';

export function useReportMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, ...data }: ReportMatchResultRequest & { matchId: string }) => {
      const response = await matchmakingRequest<Match>(`/matches/${matchId}/result`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Match.parse(response);
    },
    onSuccess: (match) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'matches', match.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', match.sessionId] });
    },
  });
}
