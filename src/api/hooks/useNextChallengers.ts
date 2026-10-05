import { useQuery } from '@tanstack/react-query';
import { matchmakingRequest } from '../../services/api';
import { schemas } from '../generated';
import type { ChallengerSuggestion } from '../inferredTypes';

/**
 * Prévia dos próximos times que a fila formaria agora, calculada pelo
 * backend com o mesmo sorteio do preenchimento de quadras. Fica sob a
 * queryKey da fila, então toda invalidação dela refaz a prévia junto.
 */
export function useNextChallengers(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['matchmaking', 'queue', sessionId, 'next'],
    queryFn: async () => {
      const data = await matchmakingRequest<ChallengerSuggestion[]>(
        `/sessions/${sessionId}/queue/next`,
        { method: 'GET' },
      );

      return schemas.ChallengerSuggestion.array().parse(data);
    },
    enabled: !!sessionId && enabled,
  });
}
