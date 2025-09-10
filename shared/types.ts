import { z, ZodError } from 'zod';
import { GameActionSchema } from './schemas/game';
import { GameTypeSchema } from '../backend/src/schemas/game-types';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
} from './schemas/history';

export { ZodError };

export const ServiceStatusResponseSchema = z.object({
  status: z.string(),
  contractVersion: z.string(),
});
export type ServiceStatusResponse = z.infer<
  typeof ServiceStatusResponseSchema
>;

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

// Table theme
export const TableThemeResponseSchema = z.object({
  hairline: z.string(),
  positions: z.record(
    z.object({
      color: z.string(),
      glow: z.string(),
      badge: z.string().optional(),
    }),
  ),
});
export type TableThemeResponse = z.infer<typeof TableThemeResponseSchema>;

export {
  PrecacheListResponseSchema,
} from '../backend/src/schemas/precache';
export type {
  PrecacheListResponse,
} from '../backend/src/schemas/precache';

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

export { BonusOptionsResponseSchema } from '../backend/src/schemas/bonus';
export type { BonusOptionsResponse } from '../backend/src/schemas/bonus';

export {
  GameTypeSchema,
  GameTypeWithLabelSchema,
  GameTypeListSchema,
} from '../backend/src/schemas/game-types';
export type {
  GameType,
  GameTypeWithLabel,
  GameTypeList,
} from '../backend/src/schemas/game-types';

export {
  PlayerSchema,
  ChatMessageSchema,
  SendChatMessageRequestSchema,
  TableSchema,
  TableListSchema,
  TableDataSchema,
  CreateTableSchema,
  UpdateTableSchema,
  TableListQuerySchema,
} from '../backend/src/schemas/tables';
export type {
  Player,
  ChatMessage,
  SendChatMessageRequest,
  Table,
  TableList,
  TableData,
  CreateTableRequest,
  UpdateTableRequest,
  TableListQuery,
} from '../backend/src/schemas/tables';

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
  RevenueStreamSchema,
  RevenueBreakdownSchema,
  ActivityResponseSchema,
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
  RevenueStream,
  RevenueBreakdown,
  ActivityResponse,
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
  TournamentSimulateRequestSchema,
  TournamentSimulateResponseSchema,
} from '../backend/src/schemas/tournaments';
export type {
  AdminTournament,
  TournamentFilter,
  TournamentFilterOption,
  TournamentFiltersResponse,
  TournamentSimulateRequest,
  TournamentSimulateResponse,
} from '../backend/src/schemas/tournaments';

/** ---- Admin Messages ---- */
export {
  AdminMessageSchema,
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

/** ---- Leaderboard / Hands (backend shared) ---- */
export {
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
} from '../backend/src/schemas/leaderboard';
export type {
  TimeFilter,
  ModeFilter,
  LeaderboardRangesResponse,
  LeaderboardModesResponse,
} from '../backend/src/schemas/leaderboard';

export {
  HandProofResponse as HandProofResponseSchema,
  HandProofsResponse as HandProofsResponseSchema,
  HandLogResponse as HandLogResponseSchema,
  HandStateResponse as HandStateResponseSchema,
} from '../backend/src/schemas/hands';
export type {
  HandProofResponse,
  HandProofsResponse,
  HandLogResponse,
  HandStateResponse,
} from '../backend/src/schemas/hands';

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
