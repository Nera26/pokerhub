import { z, ZodError } from 'zod';
import { GameActionSchema } from './schemas/game';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
} from './schemas/history';

export { ZodError };

// Wallet types are available via @shared/wallet.schema

// Language selector
export const LanguageSchema = z.object({
  code: z.string(),
  label: z.string(),
});
export type Language = z.infer<typeof LanguageSchema>;
export const LanguagesResponseSchema = z.array(LanguageSchema);
export type LanguagesResponse = z.infer<typeof LanguagesResponseSchema>;

// Chip denominations
export const ChipDenominationsResponseSchema = z.object({
  denoms: z.array(z.number().positive()).nonempty(),
});
export type ChipDenominationsResponse = z.infer<
  typeof ChipDenominationsResponseSchema
>;

// Backend re-exports
export {
  UserProfileSchema,
  MeResponseSchema,
  ProfileStatsResponseSchema,
} from '../backend/src/schemas/users';
export type {
  UserProfile,
  MeResponse,
  ProfileStatsResponse,
} from '../backend/src/schemas/users';


export {
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
} from '../backend/src/schemas/withdrawals';
export type {
  PendingWithdrawalsResponse,
  WithdrawalDecisionRequest,
} from '../backend/src/schemas/withdrawals';

export {
  SidebarItemsResponseSchema,
  AdminTabResponseSchema,
} from '../backend/src/schemas/admin';
export type {
  SidebarItem,
  SidebarTab,
  AdminTab,
  AdminTabResponse,
} from '../backend/src/schemas/admin';

export {
  BONUS_TYPES,
  BONUS_ELIGIBILITY,
  BONUS_STATUSES,
  BonusOptionsResponseSchema,
} from '../backend/src/schemas/bonus';
export type { BonusOptionsResponse } from '../backend/src/schemas/bonus';

export {
  AUDIT_LOG_TYPES,
  AuditLogTypeSchema,
  AuditLogEntrySchema,
  AuditLogsResponseSchema,
  AuditSummarySchema,
  AuditLogsQuerySchema,
  AlertItemSchema,
  SecurityAlertsResponseSchema,
  AdminOverviewSchema,
  AdminOverviewResponseSchema,
} from './schemas/analytics';
export type {
  AuditLogType,
  AuditLogEntry,
  AuditLogsResponse,
  AuditSummary,
  AuditLogsQuery,
  AlertItem,
  SecurityAlertsResponse,
  AdminOverview,
  AdminOverviewResponse,
} from './schemas/analytics';

// Analytics log types
export const LogTypeClassesSchema = z.record(z.string());
export type LogTypeClasses = z.infer<typeof LogTypeClassesSchema>;

// Dashboard metrics (frontend-only)
export const DashboardMetricsSchema = z.object({
  online: z.number(),
  revenue: z.number(),
  activity: z.array(z.number()),
  errors: z.array(z.number()),
});
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

export {
  NotificationTypeSchema,
  NotificationsResponseSchema,
  UnreadCountResponseSchema,
} from '../backend/src/schemas/notifications';
export type {
  NotificationType,
  NotificationsResponse,
  UnreadCountResponse,
} from '../backend/src/schemas/notifications';

/** ---- Promotions ---- */
const PromotionProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
  barColorClass: z.string(),
});
const PromotionBreakdownItemSchema = z.object({
  label: z.string(),
  value: z.number(),
});
export const PromotionSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  reward: z.string(),
  unlockText: z.string().optional(),
  statusText: z.string().optional(),
  progress: PromotionProgressSchema.optional(),
  breakdown: z.array(PromotionBreakdownItemSchema),
  eta: z.string().optional(),
});
export type Promotion = z.infer<typeof PromotionSchema>;
export const PromotionsResponseSchema = z.array(PromotionSchema);

/** ---- Broadcasts ---- */
export {
  BroadcastSchema,
  BroadcastsResponseSchema,
  BroadcastTemplatesResponseSchema,
  BroadcastTypesResponseSchema,
} from '../backend/src/schemas/broadcasts';
export type {
  BroadcastType,
  Broadcast,
  BroadcastsResponse,
  SendBroadcastRequest,
  BroadcastTemplatesResponse,
  BroadcastTypesResponse,
} from '../backend/src/schemas/broadcasts';

/** ---- Tournaments ---- */
export {
  AdminTournamentSchema,
  TournamentFilterSchema,
  TournamentFilterOptionSchema,
  TournamentFiltersResponseSchema,
} from '../backend/src/schemas/tournaments';
export type {
  AdminTournament,
  TournamentFilter,
  TournamentFilterOption,
  TournamentFiltersResponse,
} from '../backend/src/schemas/tournaments';

/** ---- Admin Messages ---- */
export {
  AdminMessagesResponseSchema,
} from '../backend/src/schemas/messages';
export type {
  AdminMessage,
  AdminMessagesResponse,
  ReplyMessageRequest,
} from '../backend/src/schemas/messages';
export const FeatureFlagsResponseSchema = z.record(z.boolean());
export type FeatureFlagsResponse = z.infer<typeof FeatureFlagsResponseSchema>;

// Game actions
export { GameActionSchema } from './schemas/game';
export type { GameAction } from './schemas/game';
export type GameActionPayload = z.infer<typeof GameActionSchema>;

// Game state
const GameStatePlayerSchema = z.object({
  id: z.string(),
  stack: z.number(),
  folded: z.boolean(),
  bet: z.number(),
  allIn: z.boolean(),
  holeCards: z.array(z.number()).length(2).optional(),
});

export const GameStateSchema = z
  .object({
    version: z.literal('1'),
    tick: z.number(),
    phase: z.enum([
      'WAIT_BLINDS',
      'DEAL',
      'BETTING_ROUND',
      'SHOWDOWN',
      'SETTLE',
      'NEXT_HAND',
    ]),
    street: z.enum(['preflop', 'flop', 'turn', 'river', 'showdown']),
    pot: z.number(),
    sidePots: z.array(
      z.object({
        amount: z.number(),
        players: z.array(z.string()),
        contributions: z.record(z.string(), z.number()),
      }),
    ),
    currentBet: z.number(),
    players: z.array(GameStatePlayerSchema),
    communityCards: z.array(z.number()),
  })
  .strict();

export type GameState = z.infer<typeof GameStateSchema>;


// --- Table / Game Types ---
export const GameTypeSchema = z.enum([
  'texas',
  'omaha',
  'allin',
  'tournaments',
]);
export type GameType = z.infer<typeof GameTypeSchema>;
export const GameTypeWithLabelSchema = z.object({
  id: GameTypeSchema,
  label: z.string(),
});
export type GameTypeWithLabel = z.infer<typeof GameTypeWithLabelSchema>;
export const GameTypeListSchema = z.array(GameTypeWithLabelSchema);
export type GameTypeList = z.infer<typeof GameTypeListSchema>;

// Tournaments (frontend)
export const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
  gameType: GameTypeSchema,
  buyIn: z.number(),
  fee: z.number().optional(),
  prizePool: z.number(),
  state: z.enum(['REG_OPEN', 'RUNNING', 'PAUSED', 'FINISHED', 'CANCELLED']),
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export type Tournament = z.infer<typeof TournamentSchema>;

const TournamentInfoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const TournamentDetailsSchema = TournamentSchema.extend({
  registration: z.object({
    open: z.string().datetime().nullable(),
    close: z.string().datetime().nullable(),
  }),
  overview: z.array(TournamentInfoSchema),
  structure: z.array(TournamentInfoSchema),
  prizes: z.array(TournamentInfoSchema),
});
export type TournamentDetails = z.infer<typeof TournamentDetailsSchema>;


// Tables
export const TableSchema = z.object({
  id: z.string(),
  tableName: z.string(),
  gameType: GameTypeSchema,
  stakes: z.object({ small: z.number(), big: z.number() }),
  players: z.object({ current: z.number(), max: z.number() }),
  buyIn: z.object({ min: z.number(), max: z.number() }),
  stats: z.object({
    handsPerHour: z.number(),
    avgPot: z.number(),
    rake: z.number(),
  }),
  createdAgo: z.string(),
});
export const TableListSchema = z.array(TableSchema);
export type Table = z.infer<typeof TableSchema>;
export type TableList = z.infer<typeof TableListSchema>;

export const CreateTableSchema = z.object({
  tableName: z.string(),
  gameType: GameTypeSchema,
  stakes: z.object({ small: z.number(), big: z.number() }),
  startingStack: z.number(),
  players: z.object({ max: z.number() }),
  buyIn: z.object({ min: z.number(), max: z.number() }),
});
export type CreateTableRequest = z.infer<typeof CreateTableSchema>;

const UpdateTableSchema = CreateTableSchema.partial();
export type UpdateTableRequest = z.infer<typeof UpdateTableSchema>;

// Players / Chat
export const PlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  chips: z.number(),
  committed: z.number().optional(),
  isActive: z.boolean().optional(),
  isFolded: z.boolean().optional(),
  sittingOut: z.boolean().optional(),
  isAllIn: z.boolean().optional(),
  isWinner: z.boolean().optional(),
  timeLeft: z.number().optional(),
  cards: z.tuple([z.string(), z.string()]).optional(),
  pos: z.string().optional(),
  lastAction: z.string().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  text: z.string(),
  time: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendChatMessageRequestSchema = z.object({
  userId: z.string(),
  text: z.string(),
});
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequestSchema>;

export const TableDataSchema = z.object({
  smallBlind: z.number(),
  bigBlind: z.number(),
  pot: z.number(),
  communityCards: z.array(z.string()),
  players: z.array(PlayerSchema),
  chatMessages: z.array(ChatMessageSchema),
  stateAvailable: z.boolean(),
});
export type TableData = z.infer<typeof TableDataSchema>;

// --- Leaderboard ---
export const HandStateResponseSchema = z.object({
  street: z.enum(['preflop', 'flop', 'turn', 'river', 'showdown']),
  pot: z.number(),
  sidePots: z.array(
    z.object({ amount: z.number(), players: z.array(z.string()) }),
  ),
  currentBet: z.number(),
  players: z.array(
    z.object({
      id: z.string(),
      stack: z.number(),
      folded: z.boolean(),
      bet: z.number(),
      allIn: z.boolean(),
    }),
  ),
});
export type HandStateResponse = z.infer<typeof HandStateResponseSchema>;

// Fairness proof
export const HandProofSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});
export type HandProof = z.infer<typeof HandProofSchema>;
// Rebuy / PKO options
// (internal helpers only)
const RebuyOptionsSchema = z.object({
  cost: z.number().int().positive(),
  chips: z.number().int().positive(),
  threshold: z.number().int().nonnegative(),
});
const PkoOptionsSchema = z.object({
  bountyPct: z.number().min(0).max(1),
});

// Prize calculations
const CalculatePrizesRequestSchema = z.object({
  prizePool: z.number().int().nonnegative(),
  payouts: z.array(z.number()).nonempty(),
  bountyPct: z.number().min(0).max(1).optional(),
  satelliteSeatCost: z.number().int().positive().optional(),
  method: z.enum(['topN', 'icm']).optional(),
  stacks: z.array(z.number().int().nonnegative()).optional(),
});

const CalculatePrizesResponseSchema = z.object({
  prizes: z.array(z.number().int().nonnegative()),
  bountyPool: z.number().int().nonnegative().optional(),
  seats: z.number().int().nonnegative().optional(),
  remainder: z.number().int().nonnegative().optional(),
});

export type CalculatePrizesRequest = z.infer<
  typeof CalculatePrizesRequestSchema
>;
export type CalculatePrizesResponse = z.infer<
  typeof CalculatePrizesResponseSchema
>;

// Tournament scheduling
const TournamentScheduleRequestSchema = z.object({
  startTime: z.string().datetime(),
  registration: z.object({
    open: z.string().datetime(),
    close: z.string().datetime(),
  }),
  structure: z.array(
    z.object({
      level: z.number().int().positive(),
      durationMinutes: z.number().int().positive(),
    }),
  ),
  breaks: z
    .array(
      z.object({
        start: z.string().datetime(),
        durationMs: z.number().int().positive(),
      }),
    )
    .optional()
    .default([]),
});
export type TournamentScheduleRequest = z.infer<
  typeof TournamentScheduleRequestSchema
>;

const HotPatchLevelRequestSchema = z.object({
  level: z.number().int().positive(),
  smallBlind: z.number().int().positive(),
  bigBlind: z.number().int().positive(),
});
export type HotPatchLevelRequest = z.infer<typeof HotPatchLevelRequestSchema>;

// Leaderboard (backend shared)
export const LeaderboardEntrySchema = z.object({
  playerId: z.string(),
  rank: z.number().int().positive(),
  points: z.number(),
  rd: z.number(),
  volatility: z.number(),
  net: z.number(),
  bb100: z.number(),
  hours: z.number(),
  roi: z.number(),
  finishes: z.record(z.number().int().nonnegative()),
});
export const LeaderboardResponseSchema = z.array(LeaderboardEntrySchema);
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export {
  LeaderboardRangesResponseSchema,
} from '../backend/src/schemas/leaderboard';
export type {
  TimeFilter,
  LeaderboardRangesResponse,
} from '../backend/src/schemas/leaderboard';

// Users (frontend)
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  banned: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string(),
  avatarKey: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().optional(),
  avatarKey: z.string().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export const BanUserSchema = z.object({
  reason: z.string().optional(),
});
export type BanUserRequest = z.infer<typeof BanUserSchema>;

export const DashboardUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  balance: z.number(),
  banned: z.boolean(),
});
export const DashboardUserListSchema = z.array(DashboardUserSchema);
export type DashboardUser = z.infer<typeof DashboardUserSchema>;
export type DashboardUserList = z.infer<typeof DashboardUserListSchema>;

export const AdminUsersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
});
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export const TableListQuerySchema = z.object({
  status: z.enum(['active']).optional(),
});
export type TableListQuery = z.infer<typeof TableListQuerySchema>;


// Admin transaction entries (frontend modal)
const AdminTransactionEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  amount: z.number(),
  performedBy: z.string(),
  notes: z.string(),
  status: z.enum(['Completed', 'Pending', 'Rejected']),
});
export const AdminTransactionEntriesSchema = z.array(
  AdminTransactionEntrySchema,
);
export type AdminTransactionEntry = z.infer<
  typeof AdminTransactionEntrySchema
>;
export type AdminTransactionEntries = z.infer<
  typeof AdminTransactionEntriesSchema
>;

export const FilterOptionsSchema = z.object({
  types: z.array(z.string()),
  performedBy: z.array(z.string()),
});
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;

export {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
} from './schemas/history';
export type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
} from './schemas/history';

