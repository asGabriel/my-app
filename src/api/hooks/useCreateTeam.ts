import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreateTeamRequest, Team } from '../inferredTypes';

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeamRequest) => {
      const response = await matchmakingRequest<Team>('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Team.parse(response);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', variables.sessionId] });
    },
  });
}
