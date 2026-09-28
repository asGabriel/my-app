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
