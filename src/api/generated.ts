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

export const schemas = {
  ListIncomesFilters,
  Income,
  ListPaymentsFilters,
  Payment,
};

const endpoints = makeApi([
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

export const IncomeListResponseSchema = z.array(Income);
export type IncomeListResponse = z.infer<typeof IncomeListResponseSchema>;

export const PaymentListResponseSchema = z.array(Payment);
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
