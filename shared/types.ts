import { z } from 'zod';

export * from './wallet.schema';

export const StatusResponseSchema = z.object({
  status: z.string(),
});
export type StatusResponse = z.infer<typeof StatusResponseSchema>;

export const ServiceStatusResponseSchema = z.object({
  status: z.string(),
  contractVersion: z.string(),
});
export type ServiceStatusResponse = z.infer<
  typeof ServiceStatusResponseSchema
>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = LoginRequestSchema;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

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

export const DashboardMetricsSchema = z.object({
  online: z.number(),
  revenue: z.number(),
});
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

export const AuditLogTypeSchema = z.enum([
  'Login',
  'Table Event',
  'Broadcast',
  'Error',
]);
export type AuditLogType = z.infer<typeof AuditLogTypeSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.number().int(),
  timestamp: z.string().datetime(),
  type: AuditLogTypeSchema,
  description: z.string(),
  user: z.string(),
  ip: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AuditLogsResponseSchema = z.object({
  logs: z.array(AuditLogEntrySchema),
  nextCursor: z.number().int().nullable().optional(),
});
export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;

export const AuditSummarySchema = z.object({
  total: z.number().int(),
  errors: z.number().int(),
  logins: z.number().int(),
});
export type AuditSummary = z.infer<typeof AuditSummarySchema>;

export {
  AlertItemSchema,
  SecurityAlertsResponseSchema,
} from '../backend/src/schemas/analytics';
export type {
  AlertItem,
  SecurityAlertsResponse,
} from '../backend/src/schemas/analytics';
/** ---- Notifications ---- */
export const NotificationTypeSchema = z.enum(['bonus', 'tournament', 'system']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  timestamp: z.string().datetime(),
  read: z.boolean(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
});
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

/** ---- Promotions ---- */
export const PromotionProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
  barColorClass: z.string(),
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
} from '../backend/src/schemas/broadcasts';
export type {
  BroadcastType,
  Broadcast,
  BroadcastsResponse,
  SendBroadcastRequest,
} from '../backend/src/schemas/broadcasts';

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

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;


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

const BaseAction = z.object({
  tableId: z.string(),
  playerId: z.string(),
});

export const PostBlindActionSchema = BaseAction.extend({
  type: z.literal('postBlind'),
  amount: z.number().int().positive(),
});

export const BetActionSchema = BaseAction.extend({
  type: z.literal('bet'),
  amount: z.number().int().positive(),
});

export const RaiseActionSchema = BaseAction.extend({
  type: z.literal('raise'),
  amount: z.number().int().positive(),
});

export const CallActionSchema = BaseAction.extend({
  type: z.literal('call'),
  amount: z.number().int().positive().optional(),
});

export const CheckActionSchema = BaseAction.extend({
  type: z.literal('check'),
});

export const FoldActionSchema = BaseAction.extend({
  type: z.literal('fold'),
});

export const NextActionSchema = z.object({
  type: z.literal('next'),
  tableId: z.string(),
});

const GameActionPayloadSchema = z.discriminatedUnion('type', [
  PostBlindActionSchema,
  BetActionSchema,
  RaiseActionSchema,
  CallActionSchema,
  CheckActionSchema,
  FoldActionSchema,
  NextActionSchema,
]);

export type GameActionPayload = z.infer<typeof GameActionPayloadSchema>;

export const GameActionSchema = z
  .object({ version: z.literal('1') })
  .and(GameActionPayloadSchema);

export type GameAction = z.infer<typeof GameActionSchema>;

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

export const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
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

export const TournamentDetailSchema = TournamentSchema.extend({
  registration: z.object({
    open: z.string().datetime().nullable(),
    close: z.string().datetime().nullable(),
  }),
});
export type TournamentDetail = z.infer<typeof TournamentDetailSchema>;

export const TournamentRegisterRequestSchema = z.object({});
export type TournamentRegisterRequest = z.infer<
  typeof TournamentRegisterRequestSchema
>;

export const TournamentWithdrawRequestSchema =
  TournamentRegisterRequestSchema;
export type TournamentWithdrawRequest = TournamentRegisterRequest;

// --- Table / Game Types ---
export const GameTypeSchema = z.enum([
  'texas',
  'omaha',
  'allin',
  'tournaments',
]);
export type GameType = z.infer<typeof GameTypeSchema>;

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

// Commitment, seed and nonce proving deck fairness for a hand
// Used by GET /hands/:id/proof
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

// Raw JSONL hand history
export const HandLogResponseSchema = z.string();
export type HandLogResponse = z.infer<typeof HandLogResponseSchema>;

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

export const ReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewActionRequestSchema = z.object({
  action: ReviewActionSchema,
});
export type ReviewActionRequest = z.infer<typeof ReviewActionRequestSchema>;

export const ReviewStatusSchema = z.enum([
  'flagged',
  'warn',
  'restrict',
  'ban',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const FlaggedSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  status: ReviewStatusSchema.optional(),
});
export type FlaggedSessionsQuery = z.infer<typeof FlaggedSessionsQuerySchema>;

export const FlaggedSessionSchema = z.object({
  id: z.string(),
  users: z.array(z.string()),
  status: ReviewStatusSchema,
});
export type FlaggedSession = z.infer<typeof FlaggedSessionSchema>;
export const FlaggedSessionsResponseSchema = z.array(FlaggedSessionSchema);
export type FlaggedSessionsResponse = z.infer<
  typeof FlaggedSessionsResponseSchema
>;

export const ReviewActionLogSchema = z.object({
  action: ReviewActionSchema,
  timestamp: z.number().int(),
  reviewerId: z.string(),
});
export type ReviewActionLog = z.infer<typeof ReviewActionLogSchema>;
export const ReviewActionLogsResponseSchema = z.array(ReviewActionLogSchema);
export type ReviewActionLogsResponse = z.infer<
  typeof ReviewActionLogsResponseSchema
>;

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
