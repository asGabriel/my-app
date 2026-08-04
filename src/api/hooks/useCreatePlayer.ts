import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { CreatePlayerRequest, Player } from '../inferredTypes';

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlayerRequest) => {
      const response = await matchmakingRequest<Player>('/players/', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return schemas.Player.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchmaking', 'players'] });
    },
  });
}
