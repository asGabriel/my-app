import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LoginRequest = z
  .object({ username: z.string(), password: z.string() })
  .passthrough();
const UserResponse = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    name: z.string(),
    is_active: z.boolean(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }).nullish(),
  })
  .passthrough();
const AuthResponse = z
  .object({ token: z.string(), user: UserResponse })
  .passthrough();
const RegisterRequest = z
  .object({
    username: z.string(),
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
  })
  .passthrough();
const ListIncomesFilters = z
  .object({ startDate: z.string(), endDate: z.string() })
  .partial()
  .passthrough();
const Income = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    accountId: z.string().uuid(),
    description: z.string(),
    amount: z.string(),
    reference: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const CreateIncomeRequest = z
  .object({
    accountIdentification: z.string(),
    description: z.string(),
    amount: z.string(),
    dateReference: z.string(),
  })
  .passthrough();
const ListPaymentsFilters = z
  .object({
    debtIds: z.array(z.string().uuid()),
    accountIds: z.array(z.string().uuid()),
    startDate: z.string(),
    endDate: z.string(),
  })
  .partial()
  .passthrough();
const Payment = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    debtId: z.string().uuid(),
    accountId: z.string().uuid(),
    amount: z.string(),
    paymentDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const CreatePaymentRequest = z
  .object({
    debtId: z.string().uuid(),
    accountId: z.string().uuid().nullish(),
    paymentDate: z.string(),
    amount: z.string().nullish(),
    reconcile: z.boolean().nullish(),
  })
  .passthrough();
const DebtFilters = z
  .object({
    ids: z.array(z.string().uuid()),
    statuses: z.array(z.enum(["UNPAID", "PARTIALLY_PAID", "SETTLED"])),
    startDate: z.string(),
    endDate: z.string(),
  })
  .partial()
  .passthrough();
const Debt = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    category: z.string(),
    tags: z.array(z.string()),
    identification: z.string(),
    description: z.string(),
    totalAmount: z.string(),
    paidAmount: z.string(),
    discountAmount: z.string(),
    remainingAmount: z.string(),
    dueDate: z.string(),
    status: z.enum(["UNPAID", "PARTIALLY_PAID", "SETTLED"]),
    installmentCount: z.number().int().nullish(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const CreateDebtRequest = z
  .object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string(),
    dueDate: z.string(),
    totalAmount: z.string(),
    paidAmount: z.string().optional(),
    discountAmount: z.string().optional(),
    status: z.enum(["UNPAID", "PARTIALLY_PAID", "SETTLED"]).optional(),
    isPaid: z.boolean(),
    accountId: z.string().uuid().optional(),
    installmentCount: z.number().int().optional(),
  })
  .passthrough();
const AccountListFilters = z
  .object({
    clientId: z.string().uuid(),
    ids: z.array(z.string().uuid()),
    identifications: z.array(z.string()),
  })
  .partial()
  .passthrough();
const AccountConfiguration = z
  .object({ defaultDueDate: z.number().int().nullable() })
  .partial()
  .passthrough();
const BankAccount = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    name: z.string(),
    owner: z.string(),
    identification: z.string(),
    configuration: AccountConfiguration,
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();

export const schemas = {
  LoginRequest,
  UserResponse,
  AuthResponse,
  RegisterRequest,
  ListIncomesFilters,
  Income,
  CreateIncomeRequest,
  ListPaymentsFilters,
  Payment,
  CreatePaymentRequest,
  DebtFilters,
  Debt,
  CreateDebtRequest,
  AccountListFilters,
  AccountConfiguration,
  BankAccount,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/auth/login",
    alias: "login",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: AuthResponse,
    errors: [
      {
        status: 401,
        description: `Credenciais inválidas`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/auth/me",
    alias: "getMe",
    requestFormat: "json",
    response: UserResponse,
    errors: [
      {
        status: 401,
        description: `Não autenticado`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/auth/register",
    alias: "register",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RegisterRequest,
      },
    ],
    response: AuthResponse,
    errors: [
      {
        status: 400,
        description: `Dados inválidos`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/financeManager/account/list",
    alias: "listAccounts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AccountListFilters,
      },
    ],
    response: z.array(BankAccount),
  },
  {
    method: "post",
    path: "/financeManager/debt",
    alias: "createDebt",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateDebtRequest,
      },
    ],
    response: Debt,
  },
  {
    method: "post",
    path: "/financeManager/debt/list",
    alias: "listDebts",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: DebtFilters,
      },
    ],
    response: z.array(Debt),
  },
  {
    method: "post",
    path: "/financeManager/income",
    alias: "createIncome",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateIncomeRequest,
      },
    ],
    response: Income,
  },
  {
    method: "post",
    path: "/financeManager/income/list",
    alias: "listIncomes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ListIncomesFilters,
      },
    ],
    response: z.array(Income),
  },
  {
    method: "post",
    path: "/financeManager/payment",
    alias: "createPayment",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePaymentRequest,
      },
    ],
    response: Payment,
  },
  {
    method: "post",
    path: "/financeManager/payment/list",
    alias: "listPayments",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ListPaymentsFilters,
      },
    ],
    response: z.array(Payment),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

export type LoginRequest = z.infer<typeof LoginRequest>;
export type RegisterRequest = z.infer<typeof RegisterRequest>;
export type UserResponse = z.infer<typeof UserResponse>;
export type AuthResponse = z.infer<typeof AuthResponse>;
export const UserResponseSchema = UserResponse;
export const AuthResponseSchema = AuthResponse;

export type ListIncomesFilters = z.infer<typeof ListIncomesFilters>;
export type Income = z.infer<typeof Income>;
export type CreateIncomeRequest = z.infer<typeof CreateIncomeRequest>;
export type ListPaymentsFilters = z.infer<typeof ListPaymentsFilters>;
export type Payment = z.infer<typeof Payment>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequest>;
export type DebtFilters = z.infer<typeof DebtFilters>;
export type Debt = z.infer<typeof Debt>;
export type CreateDebtRequest = z.infer<typeof CreateDebtRequest>;

export type AccountListFilters = z.infer<typeof AccountListFilters>;
export type AccountConfiguration = z.infer<typeof AccountConfiguration>;
export type BankAccount = z.infer<typeof BankAccount>;

export const IncomeListResponseSchema = z.array(Income);
export type IncomeListResponse = z.infer<typeof IncomeListResponseSchema>;

export const PaymentListResponseSchema = z.array(Payment);
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;

export const DebtListResponseSchema = z.array(Debt);
export type DebtListResponse = z.infer<typeof DebtListResponseSchema>;

export const BankAccountListResponseSchema = z.array(BankAccount);
export type BankAccountListResponse = z.infer<typeof BankAccountListResponseSchema>;

export const IncomeResponseSchema = Income;
export type IncomeResponse = z.infer<typeof IncomeResponseSchema>;

export const PaymentResponseSchema = Payment;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const DebtResponseSchema = Debt;
export type DebtResponse = z.infer<typeof DebtResponseSchema>;

export const BankAccountResponseSchema = BankAccount;
export type BankAccountResponse = z.infer<typeof BankAccountResponseSchema>;
