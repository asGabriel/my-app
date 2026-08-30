import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Team } from '../inferredTypes';

interface UpdateTeamParams {
  teamId: string;
  sessionId: string;
  playerIds: string[];
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, playerIds }: UpdateTeamParams) => {
      const response = await matchmakingRequest<Team>(`/teams/${teamId}/players`, {
        method: 'PATCH',
        body: JSON.stringify({ playerIds }),
      });

      return schemas.Team.parse(response);
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'teams', sessionId] });
      // Editing a draft roster moves players between the draft and the queue.
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'queue', sessionId] });
    },
  });
}
