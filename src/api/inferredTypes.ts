import { z } from 'zod';
import { schemas } from './generated';

/** Inferidos de `schemas` em `generated.ts` (preservados ao rodar `generate-api`). */
export type LoginRequest = z.infer<typeof schemas.LoginRequest>;
export type UserResponse = z.infer<typeof schemas.UserResponse>;
export type AuthResponse = z.infer<typeof schemas.AuthResponse>;
export type RegisterRequest = z.infer<typeof schemas.RegisterRequest>;
// financeManager: sem cobertura por hora — backend em reformulação (v2).
// Tipos voltam aqui aos poucos, junto com as rotas em openapi/index.yaml.
export type DebtStatus = z.infer<typeof schemas.DebtStatus>;
export type DebtCategory = z.infer<typeof schemas.DebtCategory>;
export type ExpenseType = z.infer<typeof schemas.ExpenseType>;
export type Debt = z.infer<typeof schemas.Debt>;
export type DebtFilters = z.infer<typeof schemas.DebtFilters>;
export type DebtList = z.infer<typeof schemas.DebtList>;
export type CreateDebtListRequest = z.infer<typeof schemas.CreateDebtListRequest>;
export type CreateDebtRequest = z.infer<typeof schemas.CreateDebtRequest>;
export type UpdateDebtRequest = z.infer<typeof schemas.UpdateDebtRequest>;
export type Payment = z.infer<typeof schemas.Payment>;
export type CreatePaymentRequest = z.infer<typeof schemas.CreatePaymentRequest>;
export type PaymentFilters = z.infer<typeof schemas.PaymentFilters>;
export type Gender = z.infer<typeof schemas.Gender>;
export type Player = z.infer<typeof schemas.Player>;
export type CreatePlayerRequest = z.infer<typeof schemas.CreatePlayerRequest>;
export type UpdatePlayerRequest = z.infer<typeof schemas.UpdatePlayerRequest>;
export type GameMode = z.infer<typeof schemas.GameMode>;
export type SessionSettings = z.infer<typeof schemas.SessionSettings>;
export type Session = z.infer<typeof schemas.Session>;
export type CreateSessionRequest = z.infer<typeof schemas.CreateSessionRequest>;
export type UpdateSessionRequest = z.infer<typeof schemas.UpdateSessionRequest>;
export type TeamStatus = z.infer<typeof schemas.TeamStatus>;
export type Team = z.infer<typeof schemas.Team>;
export type CreateTeamRequest = z.infer<typeof schemas.CreateTeamRequest>;
export type UpdateTeamRequest = z.infer<typeof schemas.UpdateTeamRequest>;
export type Match = z.infer<typeof schemas.Match>;
export type CreateMatchRequest = z.infer<typeof schemas.CreateMatchRequest>;
export type ReportMatchResultRequest = z.infer<typeof schemas.ReportMatchResultRequest>;
export type ReportMatchResultResponse = z.infer<typeof schemas.ReportMatchResultResponse>;
export type QueueEntry = z.infer<typeof schemas.QueueEntry>;
export type CourtSuggestion = z.infer<typeof schemas.CourtSuggestion>;
export type SetPinRequest = z.infer<typeof schemas.SetPinRequest>;
