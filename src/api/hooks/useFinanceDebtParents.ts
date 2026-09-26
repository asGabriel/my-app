import { useMemo } from 'react';
import { parentIdsOf } from '../../finance/debt';
import type { Debt } from '../inferredTypes';
import { useFinanceDebts } from './useFinanceDebts';

/**
 * Pais dos parcelamentos das parcelas em `debts`. Com filtro de data o
 * backend não devolve o pai (sem due_date), então ele vem numa 2ª request.
 */
export function useFinanceDebtParents(debts: Debt[] | undefined) {
  const parentIds = useMemo(() => parentIdsOf(debts ?? []), [debts]);
  const { data: parents } = useFinanceDebts({ ids: parentIds }, parentIds.length > 0);
  const parentsById = useMemo(() => new Map((parents ?? []).map((p) => [p.id, p])), [parents]);

  return { parentIds, parents, parentsById };
}
