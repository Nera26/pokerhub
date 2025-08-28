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

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
});
export type Amount = z.infer<typeof AmountSchema>;

export const WithdrawRequestSchema = z.object({
  amount: z.number().int().positive(),
  deviceId: z.string(),
});
export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

export const ProviderCallbackSchema = z.object({
  idempotencyKey: z.string(),
});
export type ProviderCallback = z.infer<typeof ProviderCallbackSchema>;

export const WalletStatusResponseSchema = z.object({
  kycVerified: z.boolean(),
});
export type WalletStatusResponse = z.infer<typeof WalletStatusResponseSchema>;

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

export const GameActionSchema = z.discriminatedUnion('type', [
  PostBlindActionSchema,
  BetActionSchema,
  RaiseActionSchema,
  CallActionSchema,
  CheckActionSchema,
  FoldActionSchema,
  NextActionSchema,
]);

export type GameAction = z.infer<typeof GameActionSchema>;

export const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
  buyIn: z.number(),
  prizePool: z.number(),
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export const TournamentListSchema = z.array(TournamentSchema);
export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentList = z.infer<typeof TournamentListSchema>;

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

// --- Leaderboard ---
export const LeaderboardRebuildQuerySchema = z.object({
  days: z.number().int().positive().max(30).optional(),
});
export type LeaderboardRebuildQuery = z.infer<
  typeof LeaderboardRebuildQuerySchema
>;

export const HandProofResponseSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});
export type HandProofResponse = z.infer<typeof HandProofResponseSchema>;

// Raw JSONL hand history
export const HandLogResponseSchema = z.string();
export type HandLogResponse = z.infer<typeof HandLogResponseSchema>;

export const CalculatePrizesRequestSchema = z.object({
  prizePool: z.number().int().nonnegative(),
  payouts: z.array(z.number()).nonempty(),
  bountyPct: z.number().min(0).max(1).optional(),
  satelliteSeatCost: z.number().int().positive().optional(),
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
});
export const LeaderboardResponseSchema = z.array(LeaderboardEntrySchema);
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export const ReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewStatusSchema = z.enum([
  'flagged',
  'warn',
  'restrict',
  'ban',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

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
