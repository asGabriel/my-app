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
  .object({
    financialInstrumentIds: z.array(z.string().uuid()),
    startDate: z.string(),
    endDate: z.string(),
  })
  .partial()
  .passthrough();
const Income = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    financialInstrumentId: z.string().uuid().nullish(),
    description: z.string(),
    amount: z.string(),
    reference: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const CreateIncomeRequest = z
  .object({
    financialInstrumentId: z.string().uuid(),
    description: z.string(),
    amount: z.string(),
    dateReference: z.string(),
  })
  .passthrough();
const ListPaymentsFilters = z
  .object({
    debtIds: z.array(z.string().uuid()),
    financialInstrumentIds: z.array(z.string().uuid()),
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
    financialInstrumentId: z.string().uuid().nullish(),
    amount: z.string(),
    paymentDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const CreatePaymentRequest = z
  .object({
    debtId: z.string().uuid(),
    financialInstrumentId: z.string().uuid().nullish(),
    paymentDate: z.string(),
    amount: z.string().nullish(),
    reconcile: z.boolean().nullish(),
  })
  .passthrough();
const DebtStatus = z.enum(["OPEN", "INSTALLMENT", "SETTLED"]);
const DebtFilters = z
  .object({
    ids: z.array(z.string().uuid()),
    statuses: z.array(DebtStatus),
    startDate: z.string(),
    endDate: z.string(),
  })
  .partial()
  .passthrough();
const ExpenseType = z.enum(["FIXED", "VARIABLE"]);
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
    status: DebtStatus,
    installmentCount: z.number().int().nullish(),
    expenseType: ExpenseType.optional(),
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
    status: DebtStatus.optional(),
    isPaid: z.boolean(),
    financialInstrumentId: z.string().uuid().optional(),
    installmentCount: z.number().int().optional(),
    expenseType: ExpenseType.optional(),
  })
  .passthrough();
const InstallmentFilters = z
  .object({
    debtIds: z.array(z.string().uuid()),
    isPaid: z.boolean(),
    startDate: z.string(),
    endDate: z.string(),
  })
  .partial()
  .passthrough();
const Installment = z
  .object({
    debtId: z.string().uuid(),
    installmentId: z.number().int(),
    dueDate: z.string(),
    amount: z.string(),
    isPaid: z.boolean(),
    paymentId: z.string().uuid().nullish(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const DebtCategory = z.enum([
  "UNKNOWN",
  "HOME",
  "TRANSPORT",
  "HEALTH",
  "FOOD",
  "LIFESTYLE",
  "EDUCATION",
  "GOALS",
  "PERSONAL",
]);
const UpdateDebtRequest = z
  .object({
    category: DebtCategory,
    expenseType: ExpenseType,
    tags: z.array(z.string()).nullable(),
    description: z.string().nullable(),
    dueDate: z.string().nullable(),
  })
  .partial()
  .passthrough();
const CreateRecurrenceRequest = z
  .object({
    financialInstrumentId: z.string().uuid().nullish(),
    description: z.string(),
    amount: z.string(),
    startDate: z.string(),
    endDate: z.string().nullish(),
    dayOfMonth: z.number().int(),
    category: DebtCategory.optional(),
  })
  .passthrough();
const Recurrence = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid().nullish(),
    financialInstrumentId: z.string().uuid().nullish(),
    description: z.string(),
    category: DebtCategory.optional(),
    amount: z.string(),
    startDate: z.string(),
    endDate: z.string().nullish(),
    dayOfMonth: z.number().int(),
    nextRunDate: z.string().nullish(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const RecurrenceFilters = z
  .object({
    clientId: z.string().uuid().nullable(),
    nextRunDate: z.string().nullable(),
    active: z.boolean().nullable(),
  })
  .partial()
  .passthrough();
const UpdateRecurrenceRequest = z
  .object({
    description: z.string().nullable(),
    dayOfMonth: z.number().int().nullable(),
    endDate: z.string().nullable(),
    active: z.boolean().nullable(),
  })
  .partial()
  .passthrough();
const FinancialInstrumentType = z.enum([
  "CREDIT_CARD",
  "DEBIT_ACCOUNT",
  "INVESTMENT_BOX",
]);
const FinancialInstrumentListFilters = z
  .object({
    clientId: z.string().uuid(),
    ids: z.array(z.string().uuid()),
    identifications: z.array(z.string()),
    instrumentTypes: z.array(FinancialInstrumentType),
  })
  .partial()
  .passthrough();
const InstrumentConfiguration = z
  .object({ defaultDueDate: z.number().int().nullable() })
  .partial()
  .passthrough();
const FinancialInstrument = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    name: z.string(),
    owner: z.string(),
    identification: z.string(),
    instrumentType: FinancialInstrumentType.optional(),
    configuration: InstrumentConfiguration,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullish(),
  })
  .passthrough();
const CreateFinancialInstrumentRequest = z
  .object({
    name: z.string(),
    owner: z.string(),
    instrumentType: FinancialInstrumentType.optional(),
    configuration: InstrumentConfiguration.optional(),
  })
  .passthrough();
const UpdateFinancialInstrumentRequest = z
  .object({
    identification: z.string(),
    name: z.string().optional(),
    owner: z.string().optional(),
    instrumentType: FinancialInstrumentType.optional(),
    configuration: InstrumentConfiguration.optional(),
  })
  .passthrough();
const Gender = z.enum(["male", "female"]);
const CreatePlayerRequest = z
  .object({ name: z.string(), gender: Gender })
  .passthrough();
const Player = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    gender: Gender,
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const UpdatePlayerRequest = z
  .object({ name: z.string().nullable(), gender: Gender })
  .partial()
  .passthrough();
const GameMode = z.enum(["male", "female", "mixed"]);
const SessionSettings = z
  .object({
    playersPerTeam: z.number().int(),
    setsToWin: z.number().int(),
    pointsPerSet: z.number().int(),
  })
  .passthrough();
const CreateSessionRequest = z
  .object({
    date: z.string(),
    availableCourts: z.number().int(),
    gameMode: GameMode,
    settings: SessionSettings.optional(),
  })
  .passthrough();
const Session = z
  .object({
    id: z.string().uuid(),
    date: z.string(),
    settings: SessionSettings,
    availableCourts: z.number().int(),
    gameMode: GameMode,
    playerIds: z.array(z.string().uuid()),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const UpdateSessionRequest = z
  .object({
    date: z.string().nullable(),
    availableCourts: z.number().int().nullable(),
    gameMode: GameMode,
    settings: SessionSettings,
    playerIds: z.array(z.string().uuid()).nullable(),
  })
  .partial()
  .passthrough();
const CreateTeamRequest = z
  .object({
    sessionId: z.string().uuid(),
    playerIds: z.array(z.string().uuid()),
  })
  .passthrough();
const Team = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    playerIds: z.array(z.string().uuid()),
    createdAt: z.string(),
  })
  .passthrough();
const CreateMatchRequest = z
  .object({
    sessionId: z.string().uuid(),
    court: z.number().int(),
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
    winnerTeamId: z.string().uuid(),
  })
  .passthrough();
const Match = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    court: z.number().int(),
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
    winnerTeamId: z.string().uuid(),
    playedAt: z.string(),
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
  DebtStatus,
  DebtFilters,
  ExpenseType,
  Debt,
  CreateDebtRequest,
  InstallmentFilters,
  Installment,
  DebtCategory,
  UpdateDebtRequest,
  CreateRecurrenceRequest,
  Recurrence,
  RecurrenceFilters,
  UpdateRecurrenceRequest,
  FinancialInstrumentType,
  FinancialInstrumentListFilters,
  InstrumentConfiguration,
  FinancialInstrument,
  CreateFinancialInstrumentRequest,
  UpdateFinancialInstrumentRequest,
  Gender,
  CreatePlayerRequest,
  Player,
  UpdatePlayerRequest,
  GameMode,
  SessionSettings,
  CreateSessionRequest,
  Session,
  UpdateSessionRequest,
  CreateTeamRequest,
  Team,
  CreateMatchRequest,
  Match,
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
    method: "patch",
    path: "/financeManager/debt/:debtId",
    alias: "updateDebt",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDebtRequest,
      },
      {
        name: "debtId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Debt,
  },
  {
    method: "post",
    path: "/financeManager/debt/installment/list",
    alias: "listInstallments",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: InstallmentFilters,
      },
    ],
    response: z.array(Installment),
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
    path: "/financeManager/debt/recurrence",
    alias: "createRecurrence",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateRecurrenceRequest,
      },
    ],
    response: Recurrence,
  },
  {
    method: "patch",
    path: "/financeManager/debt/recurrence/:recurrenceId",
    alias: "updateRecurrence",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateRecurrenceRequest,
      },
      {
        name: "recurrenceId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Recurrence,
  },
  {
    method: "post",
    path: "/financeManager/debt/recurrence/list",
    alias: "listRecurrences",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RecurrenceFilters,
      },
    ],
    response: z.array(Recurrence),
  },
  {
    method: "post",
    path: "/financeManager/financialInstrument",
    alias: "createFinancialInstrument",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFinancialInstrumentRequest,
      },
    ],
    response: FinancialInstrument,
  },
  {
    method: "patch",
    path: "/financeManager/financialInstrument",
    alias: "updateFinancialInstrument",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateFinancialInstrumentRequest,
      },
    ],
    response: FinancialInstrument,
  },
  {
    method: "post",
    path: "/financeManager/financialInstrument/list",
    alias: "listFinancialInstruments",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: FinancialInstrumentListFilters,
      },
    ],
    response: z.array(FinancialInstrument),
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
    description: `Lista pagamentos com filtros por período, débitos, instrumentos financeiros e contas.`,
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
  {
    method: "post",
    path: "/matchmaking/matches/",
    alias: "createMatch",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMatchRequest,
      },
    ],
    response: Match,
  },
  {
    method: "get",
    path: "/matchmaking/matches/:sessionId",
    alias: "listMatches",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(Match),
  },
  {
    method: "post",
    path: "/matchmaking/players/",
    alias: "createPlayer",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreatePlayerRequest,
      },
    ],
    response: Player,
  },
  {
    method: "get",
    path: "/matchmaking/players/",
    alias: "listPlayers",
    requestFormat: "json",
    response: z.array(Player),
  },
  {
    method: "patch",
    path: "/matchmaking/players/:playerId",
    alias: "updatePlayer",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePlayerRequest,
      },
      {
        name: "playerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Player,
  },
  {
    method: "post",
    path: "/matchmaking/sessions/",
    alias: "createSession",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateSessionRequest,
      },
    ],
    response: Session,
  },
  {
    method: "get",
    path: "/matchmaking/sessions/",
    alias: "listSessions",
    requestFormat: "json",
    response: z.array(Session),
  },
  {
    method: "get",
    path: "/matchmaking/sessions/:sessionId",
    alias: "getSession",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Session,
  },
  {
    method: "patch",
    path: "/matchmaking/sessions/:sessionId",
    alias: "updateSession",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateSessionRequest,
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Session,
  },
  {
    method: "post",
    path: "/matchmaking/teams/",
    alias: "createTeam",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTeamRequest,
      },
    ],
    response: Team,
  },
  {
    method: "get",
    path: "/matchmaking/teams/:sessionId",
    alias: "listTeams",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(Team),
  },
  {
    method: "post",
    path: "/matchmaking/teams/:sessionId/draw",
    alias: "drawTeams",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(Team),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
