/**
 * Tipos do domínio financeiro usados pelo Controle Mensal enquanto o backend
 * v2 não expõe as rotas de finance. Espelham os schemas removidos de
 * `src/api/generated.ts` (Debt, Installment, Income, ...), para
 * que a troca de volta pelo client gerado seja só mudar o import.
 */
export type DebtStatus = 'OPEN' | 'INSTALLMENT' | 'SETTLED';
export type ExpenseType = 'FIXED' | 'VARIABLE';
export type FinancialInstrumentType = 'CREDIT_CARD' | 'DEBIT_ACCOUNT' | 'INVESTMENT_BOX';

export interface Debt {
  id: string;
  clientId: string;
  category: string;
  tags: string[];
  identification: string;
  description: string;
  totalAmount: string;
  paidAmount: string;
  discountAmount: string;
  remainingAmount: string;
  dueDate: string;
  status: DebtStatus;
  installmentCount?: number | null;
  expenseType?: ExpenseType;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Installment {
  debtId: string;
  installmentId: number;
  dueDate: string;
  amount: string;
  isPaid: boolean;
  paymentId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Income {
  id: string;
  clientId: string;
  financialInstrumentId?: string | null;
  description: string;
  amount: string;
  reference: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface FinancialInstrument {
  id: string;
  clientId: string;
  name: string;
  owner: string;
  identification: string;
  instrumentType?: FinancialInstrumentType;
  configuration: { defaultDueDate?: number | null };
  createdAt: string;
  updatedAt?: string | null;
}

export interface Payment {
  id: string;
  clientId: string;
  debtId: string;
  accountId: string;
  financialInstrumentId?: string | null;
  amount: string;
  paymentDate: string;
  createdAt: string;
}

export interface DebtFilters {
  ids?: string[];
  statuses?: DebtStatus[];
  startDate?: string;
  endDate?: string;
}

export interface InstallmentFilters {
  debtIds?: string[];
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface IncomeFilters {
  startDate?: string;
  endDate?: string;
}

export interface FinancialInstrumentListFilters {
  ids?: string[];
  instrumentTypes?: FinancialInstrumentType[];
}

export interface CreateDebtRequest {
  category?: string;
  tags?: string[];
  description: string;
  dueDate: string;
  totalAmount: string;
  paidAmount?: string;
  discountAmount?: string;
  status?: DebtStatus;
  isPaid: boolean;
  financialInstrumentId?: string;
  installmentCount?: number;
  expenseType?: ExpenseType;
}

export interface CreatePaymentRequest {
  debtId: string;
  financialInstrumentId?: string | null;
  paymentDate: string;
  amount?: string | null;
  reconcile?: boolean | null;
}
