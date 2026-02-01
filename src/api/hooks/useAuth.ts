import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authRequest } from '../../services/api';
import { schemas } from '../generated';

type LoginRequest = typeof schemas.LoginRequest._type;
type AuthResponse = typeof schemas.AuthResponse._type;
type UserResponse = typeof schemas.UserResponse._type;

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const data = await authRequest<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      return schemas.AuthResponse.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

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
