import type { IncomeCategory } from '../api';
import type { DebtCategory } from '../utils/constants';

/** Ícone Phosphor por categoria — o protótipo usa um ícone por regra
 * cadastrada à mão; aqui os dados reais só trazem a categoria, então
 * mapeamos um ícone genérico por categoria. */
export const CATEGORY_ICON: Record<DebtCategory, string> = {
  HOME: 'ph ph-house-line',
  TRANSPORT: 'ph ph-car',
  HEALTH: 'ph ph-heartbeat',
  FOOD: 'ph ph-fork-knife',
  LIFESTYLE: 'ph ph-sparkle',
  EDUCATION: 'ph ph-graduation-cap',
  GOALS: 'ph ph-flag',
  SUBSCRIPTIONS: 'ph ph-repeat',
  OBLIGATIONS: 'ph ph-files',
  PURCHASES: 'ph ph-shopping-bag',
  UNKNOWN: 'ph ph-receipt',
};

export function categoryIcon(category: DebtCategory): string {
  return CATEGORY_ICON[category] ?? CATEGORY_ICON.UNKNOWN;
}

export const INCOME_CATEGORY_ICON: Record<IncomeCategory, string> = {
  SALARY: 'ph ph-briefcase',
  FREELANCE: 'ph ph-laptop',
  INVESTMENT: 'ph ph-trend-up',
  REFUND: 'ph ph-arrow-counter-clockwise',
  UNKNOWN: 'ph ph-coins',
};

export function incomeCategoryIcon(category: IncomeCategory): string {
  return INCOME_CATEGORY_ICON[category] ?? INCOME_CATEGORY_ICON.UNKNOWN;
}
