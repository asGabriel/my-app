import { z } from 'zod';

export const DateRangeRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
}).partial();

export const IncomeSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  description: z.string(),
  amount: z.string(),
  reference: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  description: z.string(),
  amount: z.string(),
  reference: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});

export const IncomeListResponseSchema = z.array(IncomeSchema);
export const ExpenseListResponseSchema = z.array(ExpenseSchema);

export type DateRangeRequest = z.infer<typeof DateRangeRequestSchema>;
export type Income = z.infer<typeof IncomeSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type IncomeListResponse = z.infer<typeof IncomeListResponseSchema>;
export type ExpenseListResponse = z.infer<typeof ExpenseListResponseSchema>;
