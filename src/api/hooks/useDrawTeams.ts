import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Team } from '../inferredTypes';

export function useDrawTeams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await matchmakingRequest<Team[]>(`/teams/${sessionId}/draw`, {
        method: 'POST',
      });

      return schemas.Team.array().parse(response);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', sessionId] });
    },
  });
}
