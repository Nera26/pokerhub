import { z, ZodError } from 'zod';
import { GameActionSchema } from './schemas/game';

export { ZodError };

// Wallet shared exports
export * from './wallet.schema';

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
  PendingWithdrawalSchema,
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
} from '../backend/src/schemas/withdrawals';
export type {
  PendingWithdrawal,
  PendingWithdrawalsResponse,
  WithdrawalDecisionRequest,
} from '../backend/src/schemas/withdrawals';

export {
  SidebarItemSchema,
  SidebarItemsResponseSchema,
  SidebarTabSchema,
  SidebarTabsResponseSchema,
} from '../backend/src/schemas/admin';
export type {
  SidebarItem,
  SidebarItemsResponse,
  SidebarTab,
  SidebarTabsResponse,
} from '../backend/src/schemas/admin';

export {
  BONUS_TYPES,
  BONUS_ELIGIBILITY,
  BONUS_STATUSES,
  BonusOptionsResponseSchema,
} from '../backend/src/schemas/bonus';
export type { BonusOptionsResponse } from '../backend/src/schemas/bonus';

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
  NotificationSchema,
  NotificationsResponseSchema,
  UnreadCountResponseSchema,
} from '../backend/src/schemas/notifications';
export type {
  NotificationType,
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
} from '../backend/src/schemas/notifications';

/** ---- Promotions ---- */
export const PromotionProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
  barColorClass: z.string(),
});
export const PromotionBreakdownItemSchema = z.object({
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
export type PromotionsResponse = z.infer<typeof PromotionsResponseSchema>;

/** ---- Broadcasts ---- */
export {
  BroadcastTypeSchema,
  BroadcastSchema,
  BroadcastsResponseSchema,
  SendBroadcastRequestSchema,
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

/** ---- Admin Tournaments ---- */
export { AdminTournamentSchema } from '../backend/src/schemas/tournaments';
export type { AdminTournament } from '../backend/src/schemas/tournaments';

/** ---- Admin Messages ---- */
export {
  AdminMessageSchema,
  AdminMessagesResponseSchema,
  ReplyMessageRequestSchema,
} from '../backend/src/schemas/messages';
export type {
  AdminMessage,
  AdminMessagesResponse,
  ReplyMessageRequest,
} from '../backend/src/schemas/messages';

// Auth refresh
export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

// Password reset
export const RequestResetRequestSchema = z.object({
  email: z.string().email(),
});
export type RequestResetRequest = z.infer<typeof RequestResetRequestSchema>;

export const VerifyResetCodeRequestSchema = z.object({
  email: z.string().email(),
  code: z.string(),
});
export type VerifyResetCodeRequest = z.infer<
  typeof VerifyResetCodeRequestSchema
>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
  code: z.string(),
  password: z.string(),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// Feature flags
export const FeatureFlagRequestSchema = z.object({
  value: z.boolean(),
});
export type FeatureFlagRequest = z.infer<typeof FeatureFlagRequestSchema>;

export const FeatureFlagSchema = z.object({
  key: z.string(),
  value: z.boolean(),
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

export const FeatureFlagsResponseSchema = z.record(z.boolean());
export type FeatureFlagsResponse = z.infer<typeof FeatureFlagsResponseSchema>;

// Game actions
export { GameActionSchema } from './schemas/game';
export type { GameAction } from './schemas/game';
export type GameActionPayload = z.infer<typeof GameActionSchema>;

// Game state
export const GameStatePlayerSchema = z.object({
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

export const GameStateDeltaSchema = z.object({
  version: z.literal('1'),
  tick: z.number(),
  delta: z.record(z.unknown()),
});
export type GameStateDelta = z.infer<typeof GameStateDeltaSchema>;

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
export const TournamentListSchema = z.array(TournamentSchema);
export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentList = z.infer<typeof TournamentListSchema>;

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

export const TournamentRegisterRequestSchema = z.object({});
export type TournamentRegisterRequest = z.infer<
  typeof TournamentRegisterRequestSchema
>;

export const TournamentWithdrawRequestSchema =
  TournamentRegisterRequestSchema;
export type TournamentWithdrawRequest = TournamentRegisterRequest;

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

export const UpdateTableSchema = CreateTableSchema.partial();
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
export type Player = z.infer<typeof PlayerSchema>;

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

export const ChatMessagesResponseSchema = z.array(ChatMessageSchema);
export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;

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
export const LeaderboardRebuildQuerySchema = z.object({
  days: z.number().int().positive().max(30).optional(),
});
export type LeaderboardRebuildQuery = z.infer<
  typeof LeaderboardRebuildQuerySchema
>;

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

export const HandProofResponseSchema = HandProofSchema;
export type HandProofResponse = HandProof;

export const HandProofsResponseSchema = z.array(
  z.object({
    id: z.string(),
    proof: HandProofSchema,
  }),
);
export type HandProofsResponse = z.infer<typeof HandProofsResponseSchema>;

// Rebuy / PKO options
export const RebuyOptionsSchema = z.object({
  cost: z.number().int().positive(),
  chips: z.number().int().positive(),
  threshold: z.number().int().nonnegative(),
});
export type RebuyOptions = z.infer<typeof RebuyOptionsSchema>;

export const PkoOptionsSchema = z.object({
  bountyPct: z.number().min(0).max(1),
});
export type PkoOptions = z.infer<typeof PkoOptionsSchema>;

// Prize calculations
export const CalculatePrizesRequestSchema = z.object({
  prizePool: z.number().int().nonnegative(),
  payouts: z.array(z.number()).nonempty(),
  bountyPct: z.number().min(0).max(1).optional(),
  satelliteSeatCost: z.number().int().positive().optional(),
  method: z.enum(['topN', 'icm']).optional(),
  stacks: z.array(z.number().int().nonnegative()).optional(),
});

export const CalculatePrizesResponseSchema = z.object({
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
export const TournamentScheduleRequestSchema = z.object({
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

export const HotPatchLevelRequestSchema = z.object({
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
  TimeFilterSchema,
  LeaderboardRangesResponseSchema,
} from '../backend/src/schemas/leaderboard';
export type {
  TimeFilter,
  LeaderboardRangesResponse,
} from '../backend/src/schemas/leaderboard';

export {
  ReviewActionSchema,
  ReviewActionRequestSchema,
  ReviewStatusSchema,
  FlaggedSessionsQuerySchema,
  FlaggedSessionSchema,
  FlaggedSessionsResponseSchema,
  ReviewActionLogSchema,
  ReviewActionLogsResponseSchema,
} from '../backend/src/schemas/review';
export type {
  ReviewAction,
  ReviewActionRequest,
  ReviewStatus,
  FlaggedSessionsQuery,
  FlaggedSession,
  FlaggedSessionsResponse,
  ReviewActionLog,
  ReviewActionLogsResponse,
} from '../backend/src/schemas/review';

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

export const GetUserResponseSchema = UserSchema;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;

// Transaction entries (frontend modal)
export const TransactionEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  amount: z.number(),
  performedBy: z.string(),
  notes: z.string(),
  status: z.enum(['Completed', 'Pending', 'Rejected']),
});
export const TransactionEntriesSchema = z.array(TransactionEntrySchema);
export type TransactionEntry = z.infer<typeof TransactionEntrySchema>;
export type TransactionEntries = z.infer<typeof TransactionEntriesSchema>;

export const FilterOptionsSchema = z.object({
  types: z.array(z.string()),
  performedBy: z.array(z.string()),
});
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;

/** ---- Transactions (shared) ---- */
export {
  TransactionTypeSchema,
  TransactionTypesResponseSchema,
  TransactionLogEntrySchema,
  TransactionLogResponseSchema,
  TransactionLogQuerySchema,
} from './transactions.schema';
export type {
  TransactionType,
  TransactionTypesResponse,
  TransactionLogEntry,
  TransactionLogResponse,
  TransactionLogQuery,
} from './transactions.schema';
