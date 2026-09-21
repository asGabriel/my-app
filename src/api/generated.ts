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
const DebtStatus = z.enum(["OPEN", "SETTLED"]);
const DebtCategory = z.enum([
  "UNKNOWN",
  "HOME",
  "TRANSPORT",
  "HEALTH",
  "FOOD",
  "LIFESTYLE",
  "EDUCATION",
  "GOALS",
  "SUBSCRIPTIONS",
  "OBLIGATIONS",
  "PURCHASES",
]);
const DebtFilters = z
  .object({
    ids: z.array(z.string().uuid()),
    statuses: z.array(DebtStatus),
    startDate: z.string(),
    endDate: z.string(),
    categoryNames: z.array(DebtCategory),
    parentId: z.string().uuid(),
    includeChildren: z.boolean(),
  })
  .partial()
  .passthrough();
const ExpenseType = z.enum(["FIXED", "VARIABLE"]);
const Debt = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid(),
    category: DebtCategory,
    expenseType: ExpenseType,
    tags: z.array(z.string()),
    identification: z.string(),
    description: z.string(),
    totalAmount: z.string(),
    paidAmount: z.string(),
    remainingAmount: z.string(),
    dueDate: z.string().nullish(),
    status: DebtStatus,
    installmentCount: z.number().int().nullish(),
    parentId: z.string().uuid().nullish(),
    installmentNumber: z.number().int().nullish(),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
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
const GameMode = z.enum(["male", "female", "mixed", "open"]);
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
    description: z.string().nullish(),
    availableCourts: z.number().int(),
    gameMode: GameMode,
    settings: SessionSettings.optional(),
  })
  .passthrough();
const Session = z
  .object({
    id: z.string().uuid(),
    date: z.string(),
    description: z.string().nullish(),
    settings: SessionSettings,
    availableCourts: z.number().int(),
    gameMode: GameMode,
    playerIds: z.array(z.string().uuid()),
    rosterPlayerIds: z.array(z.string().uuid()),
    createdAt: z.string(),
    updatedAt: z.string().nullish(),
  })
  .passthrough();
const UpdateSessionRequest = z
  .object({
    date: z.string().nullable(),
    description: z.string().nullable(),
    availableCourts: z.number().int().nullable(),
    gameMode: GameMode,
    settings: SessionSettings,
    rosterPlayerIds: z.array(z.string().uuid()).nullable(),
  })
  .partial()
  .passthrough();
const QueueEntry = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    playerId: z.string().uuid(),
    gamesPlayed: z.number().int(),
    enqueuedAt: z.string(),
    pinned: z.boolean(),
    pinnedAt: z.string().nullable(),
  })
  .passthrough();
const CourtSuggestion = z
  .object({
    court: z.number().int(),
    holdingTeamId: z.string().uuid().nullable(),
    draftTeamIds: z.array(z.string().uuid()),
    missingChallenger: z.boolean(),
  })
  .passthrough();
const SetPinRequest = z.object({ pinned: z.boolean() }).passthrough();
const CreateTeamRequest = z
  .object({
    sessionId: z.string().uuid(),
    playerIds: z.array(z.string().uuid()),
  })
  .passthrough();
const TeamStatus = z.enum(["draft", "holding", "playing", "disbanded"]);
const Team = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    playerIds: z.array(z.string().uuid()),
    status: TeamStatus,
    consecutiveWins: z.number().int(),
    court: z.number().int().nullable(),
    createdAt: z.string(),
  })
  .passthrough();
const UpdateTeamRequest = z
  .object({ playerIds: z.array(z.string().uuid()) })
  .passthrough();
const CreateMatchRequest = z
  .object({
    sessionId: z.string().uuid(),
    court: z.number().int(),
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
  })
  .passthrough();
const Match = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    court: z.number().int(),
    teamAId: z.string().uuid(),
    teamBId: z.string().uuid(),
    winnerTeamId: z.string().uuid().nullable(),
    startedAt: z.string(),
    playedAt: z.string().nullable(),
  })
  .passthrough();
const ReportMatchResultRequest = z
  .object({ winnerTeamId: z.string().uuid() })
  .passthrough();
const ReportMatchResultResponse = z
  .object({ match: Match, courts: z.array(CourtSuggestion) })
  .passthrough();

export const schemas = {
  LoginRequest,
  UserResponse,
  AuthResponse,
  RegisterRequest,
  DebtStatus,
  DebtCategory,
  DebtFilters,
  ExpenseType,
  Debt,
  Gender,
  CreatePlayerRequest,
  Player,
  UpdatePlayerRequest,
  GameMode,
  SessionSettings,
  CreateSessionRequest,
  Session,
  UpdateSessionRequest,
  QueueEntry,
  CourtSuggestion,
  SetPinRequest,
  CreateTeamRequest,
  TeamStatus,
  Team,
  UpdateTeamRequest,
  CreateMatchRequest,
  Match,
  ReportMatchResultRequest,
  ReportMatchResultResponse,
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
    path: "/finance/debt/list",
    alias: "listFinanceDebts",
    description: `Por padrão devolve só as dívidas de nível-topo (pais de parcelamento inclusos, sem as parcelas). Use parentId para listar as parcelas de uma dívida, ou includeChildren para uma lista plana com tudo.`,
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
    path: "/matchmaking/matches/",
    alias: "createMatch",
    description: `Só serve para ocupar uma quadra pela primeira vez; partidas seguintes naquela quadra são criadas automaticamente ao reportar o resultado da anterior (ver &#x60;reportMatchResult&#x60;).`,
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
    method: "post",
    path: "/matchmaking/matches/:matchId/result",
    alias: "reportMatchResult",
    description: `Encerra a partida com o vencedor informado e aplica ao modelo de fila: o perdedor volta pra fila (games +1), o vencedor segura a quadra até o limite de vitórias seguidas, e cada quadra ociosa recebe um Draft desafiante sugerido da fila. NÃO inicia a próxima partida — a resposta traz as sugestões pro operador confirmar via createMatch.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ winnerTeamId: z.string().uuid() }).passthrough(),
      },
      {
        name: "matchId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ReportMatchResultResponse,
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
    path: "/matchmaking/sessions/:sessionId/check-in/:playerId",
    alias: "checkInPlayer",
    description: `Adiciona o jogador à lista de presentes (playerIds) e à fila de espera da sessão, tornando-o elegível para os sorteios de quadra. O jogador precisa estar no roster da sessão (rosterPlayerIds) — responde 409 se não estiver. Idempotente. Responde 404 se a sessão ou o jogador não existir.`,
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "playerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Session,
  },
  {
    method: "delete",
    path: "/matchmaking/sessions/:sessionId/check-in/:playerId",
    alias: "checkOutPlayer",
    description: `Remove o jogador da lista de presentes (playerIds) e da fila de espera da sessão. O jogador continua no roster. Idempotente. Responde 404 se a sessão ou o jogador não existir.`,
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "playerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Session,
  },
  {
    method: "get",
    path: "/matchmaking/sessions/:sessionId/queue",
    alias: "getSessionQueue",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(QueueEntry),
  },
  {
    method: "patch",
    path: "/matchmaking/sessions/:sessionId/queue/:playerId",
    alias: "setQueuePin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ pinned: z.boolean() }).passthrough(),
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "playerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: QueueEntry,
  },
  {
    method: "post",
    path: "/matchmaking/sessions/:sessionId/queue/fill",
    alias: "fillIdleCourts",
    description: `Roda a mesma varredura de &quot;preencher quadras ociosas&quot; do reportar resultado, mas sob demanda — pra quando as quadras estão ociosas com missingChallenger e não há partida em andamento pra disparar isso (ex.: jogadores chegaram atrasados e foram confirmados agora).`,
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(CourtSuggestion),
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
    method: "delete",
    path: "/matchmaking/teams/:teamId",
    alias: "discardDraft",
    description: `Só se aplica a um time com status Draft. Os jogadores voltam pra fila da sessão.`,
    requestFormat: "json",
    parameters: [
      {
        name: "teamId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "patch",
    path: "/matchmaking/teams/:teamId/players",
    alias: "updateTeam",
    description: `Só pode ser aplicado a um time Draft. Quem entra no roster sai da fila da sessão (ou, se estiver em outro Draft, esse Draft é desfeito); quem sai do roster volta pra fila.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateTeamRequest,
      },
      {
        name: "teamId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: Team,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
