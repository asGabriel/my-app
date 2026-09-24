/**
 * Regras de leitura de `Debt` (módulo `finance`, rust-api) compartilhadas
 * entre as telas de finanças.
 *
 * Um parcelamento é um pai (`installmentCount` preenchido, `dueDate` nulo)
 * com N filhas (`parentId` preenchido, `installmentNumber` 1..N). Só as
 * filhas são pagáveis; o pai é a fonte da verdade do total de parcelas e do
 * saldo em aberto do parcelamento inteiro.
 */
import dayjs from 'dayjs';
import { schemas } from '../api/generated';
import type { Debt } from '../api/inferredTypes';

/** Parcela (filha) de um parcelamento. */
export function isInstallment(debt: Debt): boolean {
  return !!debt.parentId;
}

/** Dívida-pai de um parcelamento — não é paga direto, só as parcelas. */
export function isInstallmentParent(debt: Debt): boolean {
  return !debt.parentId && typeof debt.installmentCount === 'number' && debt.installmentCount >= 1;
}

export function isSettled(debt: Debt): boolean {
  return debt.status === schemas.DebtStatus.enum.SETTLED;
}

export function isOpen(debt: Debt): boolean {
  return debt.status === schemas.DebtStatus.enum.OPEN;
}

/** Valores da dívida como número (o backend serializa Decimal como string). */
export function debtAmounts(debt: Debt): { total: number; paid: number; remaining: number } {
  return {
    total: parseFloat(debt.totalAmount),
    paid: parseFloat(debt.paidAmount),
    remaining: parseFloat(debt.remainingAmount),
  };
}

/** Ids (sem repetição) dos pais das parcelas em `debts`. */
export function parentIdsOf(debts: Debt[]): string[] {
  return Array.from(new Set(debts.flatMap((d) => (d.parentId ? [d.parentId] : []))));
}

/** Pai da parcela em `debtsById`, se `debt` for parcela e o pai estiver carregado. */
export function parentOf(debt: Debt, debtsById: Map<string, Debt>): Debt | undefined {
  return debt.parentId ? debtsById.get(debt.parentId) : undefined;
}

/**
 * Total de parcelas do parcelamento. O pai vem primeiro: nas filhas o
 * backend pode devolver a contagem nula.
 */
export function installmentCountOf(debt: Debt, parent?: Debt): number | undefined {
  return parent?.installmentCount ?? debt.installmentCount ?? undefined;
}

/** Vencimento da última parcela — são mensais, então cai (contagem - número) meses depois desta. */
export function lastInstallmentDueDate(debt: Debt, parent?: Debt): dayjs.Dayjs | null {
  const count = installmentCountOf(debt, parent);
  return debt.dueDate && count && debt.installmentNumber
    ? dayjs(debt.dueDate).add(count - debt.installmentNumber, 'month')
    : null;
}
