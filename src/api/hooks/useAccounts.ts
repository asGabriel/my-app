import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AccountListFilters, 
  BankAccountListResponse, 
  BankAccountListResponseSchema 
} from '../generated';

export function useAccounts(filters: AccountListFilters = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const data = await apiRequest<BankAccountListResponse>(
        '/account/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return BankAccountListResponseSchema.parse(data);
    },
    enabled: !!token,
  });
}
