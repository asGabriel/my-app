import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ListIncomesFilters = z
  .object({ startDate: z.string(), endDate: z.string() })
  .partial()
  .passthrough();
const Income = z
  .object({
    id: z.string().uuid(),
    accountId: z.string().uuid(),
    description: z.string(),
    amount: z.string(),
    reference: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
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

export const schemas = {
  ListIncomesFilters,
  Income,
  ListPaymentsFilters,
  Payment,
  CreatePaymentRequest,
  DebtFilters,
  Debt,
  CreateDebtRequest,
};

const endpoints = makeApi([
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

export type ListIncomesFilters = z.infer<typeof ListIncomesFilters>;
export type Income = z.infer<typeof Income>;
export type ListPaymentsFilters = z.infer<typeof ListPaymentsFilters>;
export type Payment = z.infer<typeof Payment>;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequest>;
export type DebtFilters = z.infer<typeof DebtFilters>;
export type Debt = z.infer<typeof Debt>;
export type CreateDebtRequest = z.infer<typeof CreateDebtRequest>;

export const IncomeListResponseSchema = z.array(Income);
export type IncomeListResponse = z.infer<typeof IncomeListResponseSchema>;

export const PaymentListResponseSchema = z.array(Payment);
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;

export const DebtListResponseSchema = z.array(Debt);
export type DebtListResponse = z.infer<typeof DebtListResponseSchema>;

export const PaymentResponseSchema = Payment;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const DebtResponseSchema = Debt;
export type DebtResponse = z.infer<typeof DebtResponseSchema>;
