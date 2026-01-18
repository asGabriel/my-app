import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ListIncomesFilters = z
  .object({ startDate: z.string(), endDate: z.string() })
  .partial()
  .passthrough();
const Income = z
  .object({
    id: z.string().uuid(),
    account_id: z.string().uuid(),
    description: z.string(),
    amount: z.string(),
    reference: z.string(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }).nullish(),
  })
  .passthrough();

export const schemas = {
  ListIncomesFilters,
  Income,
};

export const ListIncomesFiltersSchema = ListIncomesFilters;
export const IncomeSchema = Income;
export const IncomeListResponseSchema = z.array(Income);

export type ListIncomesFilters = z.infer<typeof ListIncomesFilters>;
export type Income = z.infer<typeof Income>;
export type IncomeListResponse = z.infer<typeof IncomeListResponseSchema>;

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
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
