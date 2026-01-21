import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  InstallmentFilters, 
  InstallmentListResponse, 
  InstallmentListResponseSchema 
} from '../generated';

export function useInstallments(filters: InstallmentFilters = {}, enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['installments', filters],
    queryFn: async () => {
      const data = await apiRequest<InstallmentListResponse>(
        '/debt/installment/list',
        {
          method: 'POST',
          body: JSON.stringify(filters),
          token: token!,
        }
      );

      return InstallmentListResponseSchema.parse(data);
    },
    enabled: !!token && enabled,
  });
}
