import { useQuery } from '@tanstack/react-query';
import { financeRequest } from '../../services/api';
import { schemas } from '../generated';

export function useFinanceLists() {
  return useQuery({
    queryKey: ['finance', 'lists'],
    queryFn: async () => {
      const data = await financeRequest<unknown>('/list');

      return schemas.DebtList.array().parse(data);
    },
  });
}
