import type { ExpenseType, FinancialInstrumentType, DebtStatus } from '../api';

export type { DebtStatus };

export type DebtCategory = 'UNKNOWN' | 'HOME' | 'TRANSPORT' | 'HEALTH' | 'FOOD' | 'LIFESTYLE' | 'EDUCATION' | 'GOALS' | 'PERSONAL';

export const DEBT_CATEGORY_LABELS: Record<DebtCategory, string> = {
    UNKNOWN: 'Outros',
    HOME: 'Moradia',
    TRANSPORT: 'Transporte',
    HEALTH: 'Saúde',
    FOOD: 'Alimentação',
    LIFESTYLE: 'Estilo de Vida',
    EDUCATION: 'Educação',
    GOALS: 'Metas',
    PERSONAL: 'Pessoal',
};

export const DEBT_CATEGORY_OPTIONS: { label: string; value: DebtCategory }[] = [
    { label: 'Moradia', value: 'HOME' },
    { label: 'Transporte', value: 'TRANSPORT' },
    { label: 'Saúde', value: 'HEALTH' },
    { label: 'Alimentação', value: 'FOOD' },
    { label: 'Estilo de Vida', value: 'LIFESTYLE' },
    { label: 'Educação', value: 'EDUCATION' },
    { label: 'Metas', value: 'GOALS' },
    { label: 'Pessoal', value: 'PERSONAL' },
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
    INSTALLMENT: 'INSTALLMENT',
    SETTLED: 'SETTLED',
} as const;

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
    OPEN: 'Em Aberto',
    INSTALLMENT: 'Parcelada',
    SETTLED: 'Quitada',
};

export const DEBT_STATUS_OPTIONS: { label: string; value: DebtStatus }[] = [
    { label: 'Em Aberto', value: 'OPEN' },
    { label: 'Parcelada', value: 'INSTALLMENT' },
    { label: 'Quitada', value: 'SETTLED' },
];

export const DEBT_STATUS_COLORS: Record<DebtStatus, 'warning' | 'processing' | 'success' | 'red' | 'orange' | 'green'> = {
    OPEN: 'warning',
    INSTALLMENT: 'processing',
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
