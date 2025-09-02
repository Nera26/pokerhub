import { z } from "zod";
import { NotificationTypeSchema } from "./types";

// Increment on breaking changes to websocket event frames
export const EVENT_SCHEMA_VERSION = '1';

export const HandStartEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  players: z.array(z.string().uuid()),
});

export const HandEndEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  winners: z.array(z.string().uuid()).optional(),
});

export const HandSettleEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  playerIds: z.array(z.string().uuid()),
  deltas: z.array(z.number()),
});

export const WalletMovementEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refType: z.string(),
  refId: z.string(),
  currency: z.string(),
});

const ActionBase = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  playerId: z.string().uuid(),
});

export const ActionBetEvent = ActionBase.extend({
  amount: z.number(),
});

export const ActionCallEvent = ActionBase.extend({
  amount: z.number(),
});

export const ActionFoldEvent = ActionBase;

export const TournamentRegisterEvent = z.object({
  tournamentId: z.string().uuid(),
  playerId: z.string().uuid(),
});

export const TournamentEliminateEvent = z.object({
  tournamentId: z.string().uuid(),
  playerId: z.string().uuid(),
  position: z.number().int().positive().optional(),
  payout: z.number().optional(),
});

export const TournamentCancelEvent = z.object({
  tournamentId: z.string().uuid(),
});

export const WalletReserveEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refId: z.string(),
  currency: z.string(),
});

export const WalletCommitEvent = z.object({
  refId: z.string(),
  amount: z.number(),
  rake: z.number(),
  currency: z.string(),
});

export const WalletRollbackEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refId: z.string(),
  currency: z.string(),
});

export const AuthLoginEvent = z.object({
  userId: z.string().uuid(),
  ts: z.number().int(),
});

export const AntiCheatWalletEvent = z.object({
  accountId: z.string().uuid(),
  operation: z.enum(["deposit", "withdraw"]),
  amount: z.number(),
  dailyTotal: z.number(),
  limit: z.number(),
  currency: z.string(),
});

export const AntiCheatCollusionEvent = z.object({
  sessionId: z.string(),
  users: z.array(z.string().uuid()),
  features: z.record(z.unknown()),
});

export const AntiCheatFlagEvent = z.union([
  AntiCheatWalletEvent,
  AntiCheatCollusionEvent,
]);

export const WalletVelocityLimitEvent = z.object({
  accountId: z.string().uuid(),
  operation: z.enum(["deposit", "withdraw"]),
  type: z.enum(["count", "amount"]),
  window: z.enum(["hour", "day"]),
  limit: z.number(),
  value: z.number(),
});

export const WalletChargebackFlagEvent = z.object({
  accountId: z.string().uuid(),
  deviceId: z.string(),
  count: z.number(),
  limit: z.number(),
});

export const WalletReconcileMismatchEvent = z.object({
  date: z.string(),
  total: z.number(),
});

export const NotificationCreateEvent = z.object({
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  message: z.string(),
});

export const WalletDepositRejectedEvent = z.object({
  accountId: z.string().uuid(),
  depositId: z.string().uuid(),
  reason: z.string().optional(),
});

export const EventSchemas = {
  "hand.start": HandStartEvent,
  "hand.end": HandEndEvent,
  "hand.settle": HandSettleEvent,
  "leaderboard.hand_settled": HandSettleEvent,
  "wallet.credit": WalletMovementEvent,
  "wallet.debit": WalletMovementEvent,
  "action.bet": ActionBetEvent,
  "action.call": ActionCallEvent,
  "action.fold": ActionFoldEvent,
  "tournament.register": TournamentRegisterEvent,
  "tournament.eliminate": TournamentEliminateEvent,
  "tournament.cancel": TournamentCancelEvent,
  "wallet.reserve": WalletReserveEvent,
  "wallet.rollback": WalletRollbackEvent,
  "wallet.commit": WalletCommitEvent,
  "auth.login": AuthLoginEvent,
  "antiCheat.flag": AntiCheatFlagEvent,
  "wallet.velocity.limit": WalletVelocityLimitEvent,
  "wallet.reconcile.mismatch": WalletReconcileMismatchEvent,
  "wallet.chargeback_flag": WalletChargebackFlagEvent,
  "notification.create": NotificationCreateEvent,
  "wallet.deposit.rejected": WalletDepositRejectedEvent,
} as const;

export type Events = {
  "hand.start": z.infer<typeof HandStartEvent>;
  "hand.end": z.infer<typeof HandEndEvent>;
  "hand.settle": z.infer<typeof HandSettleEvent>;
  "leaderboard.hand_settled": z.infer<typeof HandSettleEvent>;
  "wallet.credit": z.infer<typeof WalletMovementEvent>;
  "wallet.debit": z.infer<typeof WalletMovementEvent>;
  "action.bet": z.infer<typeof ActionBetEvent>;
  "action.call": z.infer<typeof ActionCallEvent>;
  "action.fold": z.infer<typeof ActionFoldEvent>;
  "tournament.register": z.infer<typeof TournamentRegisterEvent>;
  "tournament.eliminate": z.infer<typeof TournamentEliminateEvent>;
  "tournament.cancel": z.infer<typeof TournamentCancelEvent>;
  "wallet.reserve": z.infer<typeof WalletReserveEvent>;
  "wallet.rollback": z.infer<typeof WalletRollbackEvent>;
  "wallet.commit": z.infer<typeof WalletCommitEvent>;
  "auth.login": z.infer<typeof AuthLoginEvent>;
  "antiCheat.flag": z.infer<typeof AntiCheatFlagEvent>;
  "wallet.velocity.limit": z.infer<typeof WalletVelocityLimitEvent>;
  "wallet.reconcile.mismatch": z.infer<typeof WalletReconcileMismatchEvent>;
  "wallet.chargeback_flag": z.infer<typeof WalletChargebackFlagEvent>;
  "notification.create": z.infer<typeof NotificationCreateEvent>;
  "wallet.deposit.rejected": z.infer<typeof WalletDepositRejectedEvent>;
};

export type EventName = keyof Events;
