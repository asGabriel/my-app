import type { ExpenseType, DebtStatus, DebtCategory } from '../api';
// Instrumentos financeiros ainda não existem no módulo `finance` — tipo vem do mock.
import type { FinancialInstrumentType } from '../finance/mock';

export type { DebtStatus, DebtCategory };

export const DEBT_CATEGORY_LABELS: Record<DebtCategory, string> = {
    UNKNOWN: 'Outros',
    HOME: 'Moradia',
    TRANSPORT: 'Transporte',
    HEALTH: 'Saúde',
    FOOD: 'Alimentação',
    LIFESTYLE: 'Estilo de Vida',
    EDUCATION: 'Educação',
    GOALS: 'Metas',
    SUBSCRIPTIONS: 'Assinaturas',
    OBLIGATIONS: 'Obrigações',
    PURCHASES: 'Compras',
};

export const DEBT_CATEGORY_OPTIONS: { label: string; value: DebtCategory }[] = [
    { label: 'Moradia', value: 'HOME' },
    { label: 'Transporte', value: 'TRANSPORT' },
    { label: 'Saúde', value: 'HEALTH' },
    { label: 'Alimentação', value: 'FOOD' },
    { label: 'Estilo de Vida', value: 'LIFESTYLE' },
    { label: 'Educação', value: 'EDUCATION' },
    { label: 'Metas', value: 'GOALS' },
    { label: 'Assinaturas', value: 'SUBSCRIPTIONS' },
    { label: 'Obrigações', value: 'OBLIGATIONS' },
    { label: 'Compras', value: 'PURCHASES' },
    { label: 'Outros', value: 'UNKNOWN' },
];

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
    FIXED: 'Fixa',
    VARIABLE: 'Variável',
};

export const EXPENSE_TYPE_OPTIONS: { label: string; value: ExpenseType }[] = [
    { label: 'Fixa', value: 'FIXED' },
    { label: 'Variável', value: 'VARIABLE' },
];

export const DEBT_STATUS = {
    OPEN: 'OPEN',
    SETTLED: 'SETTLED',
} as const;

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
    OPEN: 'Em Aberto',
    SETTLED: 'Quitada',
};

export const DEBT_STATUS_OPTIONS: { label: string; value: DebtStatus }[] = [
    { label: 'Em Aberto', value: 'OPEN' },
    { label: 'Quitada', value: 'SETTLED' },
];

export const DEBT_STATUS_COLORS: Record<DebtStatus, 'warning' | 'processing' | 'success' | 'red' | 'orange' | 'green'> = {
    OPEN: 'warning',
    SETTLED: 'success',
};

export const formatDebtStatus = (status: DebtStatus): string => {
    return DEBT_STATUS_LABELS[status] || status;
};

export const FINANCIAL_INSTRUMENT_TYPE_LABELS: Record<FinancialInstrumentType, string> = {
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_ACCOUNT: 'Conta Corrente',
    INVESTMENT_BOX: 'Caixinha',
};

export const FINANCIAL_INSTRUMENT_TYPE_OPTIONS: { label: string; value: FinancialInstrumentType }[] = [
    { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
    { label: 'Conta Corrente/Débito', value: 'DEBIT_ACCOUNT' },
    { label: 'Caixinha de Investimento', value: 'INVESTMENT_BOX' },
];
