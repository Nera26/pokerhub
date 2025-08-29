import { z } from 'zod';

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

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

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

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
});
export type Amount = z.infer<typeof AmountSchema>;

export const WithdrawRequestSchema = z.object({
  amount: z.number().int().positive(),
  deviceId: z.string(),
  currency: z.string().length(3),
});
export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

export const ProviderCallbackSchema = z.object({
  eventId: z.string(),
  idempotencyKey: z.string(),
  providerTxnId: z.string(),
  status: z.enum(['approved', 'risky', 'chargeback']),
});
export type ProviderCallback = z.infer<typeof ProviderCallbackSchema>;

export const WalletStatusResponseSchema = z.object({
  kycVerified: z.boolean(),
  denialReason: z.string().optional(),
  realBalance: z.number(),
  creditBalance: z.number(),
});
export type WalletStatusResponse = z.infer<typeof WalletStatusResponseSchema>;

export const KycDenialResponseSchema = z.object({
  accountId: z.string(),
  reason: z.string().nullable(),
});
export type KycDenialResponse = z.infer<typeof KycDenialResponseSchema>;

export const WalletTransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number().int(),
  currency: z.string().length(3),
  status: z.string(),
  createdAt: z.string().datetime(),
});
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export const WalletTransactionsResponseSchema = z.object({
  realBalance: z.number(),
  creditBalance: z.number(),
  transactions: z.array(WalletTransactionSchema),
});
export type WalletTransactionsResponse = z.infer<
  typeof WalletTransactionsResponseSchema
>;

export const PendingTransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number().int(),
  currency: z.string().length(3),
  status: z.string(),
  createdAt: z.string().datetime(),
});
export type PendingTransaction = z.infer<typeof PendingTransactionSchema>;
export const PendingTransactionsResponseSchema = z.object({
  realBalance: z.number(),
  creditBalance: z.number(),
  transactions: z.array(PendingTransactionSchema),
});
export type PendingTransactionsResponse = z.infer<
  typeof PendingTransactionsResponseSchema
>;

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

export const GameStateSchema = z
  .object({ version: z.literal('1'), tick: z.number() })
  .passthrough();

export type GameState = z.infer<typeof GameStateSchema>;

export const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
  buyIn: z.number(),
  fee: z.number().optional(),
  prizePool: z.number(),
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export const TournamentListSchema = z.array(TournamentSchema);
export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentList = z.infer<typeof TournamentListSchema>;

export const TournamentRegisterRequestSchema = z.object({
  userId: z.string(),
});
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

export const TableDataSchema = z.object({
  smallBlind: z.number(),
  bigBlind: z.number(),
  pot: z.number(),
  communityCards: z.array(z.string()),
  players: z.array(PlayerSchema),
  chatMessages: z.array(ChatMessageSchema),
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

export const HandProofSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});
export type HandProof = z.infer<typeof HandProofSchema>;

// Backwards-compat alias used by older code
export const HandProofResponseSchema = HandProofSchema;
export type HandProofResponse = HandProof;

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
  net: z.number(),
  bb100: z.number(),
  hours: z.number(),
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

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  banned: z.boolean(),
  balance: z.number(),
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

export const BalanceAdjustmentSchema = z.object({
  amount: z.number(),
});
export type BalanceAdjustmentRequest = z.infer<
  typeof BalanceAdjustmentSchema
>;
