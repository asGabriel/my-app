import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { UpdatePlayerRequest, Player } from '../inferredTypes';

interface UpdatePlayerParams {
  playerId: string;
  data: UpdatePlayerRequest;
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerId, data }: UpdatePlayerParams) => {
      const response = await matchmakingRequest<Player>(`/players/${playerId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      return schemas.Player.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'players'] });
    },
  });
}
