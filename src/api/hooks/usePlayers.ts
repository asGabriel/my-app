import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { Player } from '../inferredTypes';

export function usePlayers(enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'players'],
    queryFn: async () => {
      const data = await matchmakingRequest<Player[]>('/players', {
        method: 'GET',
      });

      return schemas.Player.array().parse(data);
    },
    enabled,
  });
}
