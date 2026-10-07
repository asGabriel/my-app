import { useQuery } from '@tanstack/react-query';
import { authRequest } from '../../services/api';
import { schemas } from '../generated';

type UserResponse = typeof schemas.UserResponse._type;

export function useMe(token: string | null) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await authRequest<UserResponse>('/me', {
        method: 'GET',
        token: token || undefined,
      });

      return schemas.UserResponse.parse(data);
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
