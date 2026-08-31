import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { ReportMatchResultRequest, ReportMatchResultResponse } from '../inferredTypes';

/**
 * Reports a result. The response carries the finished match plus, per idle
 * court, the `Draft` challenger(s) the operator should confirm/edit/discard
 * — nothing is auto-started.
 */
export function useReportMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, ...data }: ReportMatchResultRequest & { matchId: string }) => {
      const response = await matchmakingRequest<ReportMatchResultResponse>(
        `/matches/${matchId}/result`,
        { method: 'POST', body: JSON.stringify(data) },
      );

      return schemas.ReportMatchResultResponse.parse(response);
    },
    onSuccess: ({ match }) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'matches', match.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', match.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', match.sessionId] });
    },
  });
}
