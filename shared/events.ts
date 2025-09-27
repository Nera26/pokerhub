import { z } from "zod";
import { NotificationTypeSchema } from "./types";

// Increment on breaking changes to websocket event frames
export const EVENT_SCHEMA_VERSION = '1';

const HandStartEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  players: z.array(z.string().uuid()),
});

const HandEndEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  winners: z.array(z.string().uuid()).optional(),
});

const HandSettleEvent = z.object({
  handId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  playerIds: z.array(z.string().uuid()),
  deltas: z.array(z.number()),
});

const WalletMovementEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refType: z.string(),
  refId: z.string(),
  currency: z.string(),
});

const TournamentCancelEvent = z.object({
  tournamentId: z.string().uuid(),
});

const WalletReserveEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refId: z.string(),
  currency: z.string(),
});

const WalletCommitEvent = z.object({
  refId: z.string(),
  amount: z.number(),
  rake: z.number(),
  currency: z.string(),
});

const WalletRollbackEvent = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  refId: z.string(),
  currency: z.string(),
});

const AuthLoginEvent = z.object({
  userId: z.string().uuid(),
  ts: z.number().int(),
});

const AntiCheatWalletEvent = z.object({
  accountId: z.string().uuid(),
  operation: z.enum(["deposit", "withdraw"]),
  amount: z.number(),
  dailyTotal: z.number(),
  limit: z.number(),
  currency: z.string(),
});

const AntiCheatCollusionEvent = z.object({
  sessionId: z.string(),
  users: z.array(z.string().uuid()),
  features: z.record(z.unknown()),
});

const AntiCheatFlagEvent = z.union([
  AntiCheatWalletEvent,
  AntiCheatCollusionEvent,
]);

const WalletVelocityLimitEvent = z.object({
  accountId: z.string().uuid(),
  operation: z.enum(["deposit", "withdraw"]),
  type: z.enum(["count", "amount"]),
  window: z.enum(["hour", "day"]),
  limit: z.number(),
  value: z.number(),
});

const WalletChargebackFlagEvent = z.object({
  accountId: z.string().uuid(),
  deviceId: z.string(),
  count: z.number(),
  limit: z.number(),
});

const WalletReconcileMismatchEvent = z.object({
  date: z.string(),
  total: z.number(),
});

const WalletReconcileMismatchAcknowledgedEvent = z.object({
  account: z.string(),
  acknowledgedBy: z.string(),
  acknowledgedAt: z.string().datetime(),
});

const NotificationCreateEvent = z.object({
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  message: z.string(),
});

const WalletDepositRejectedEvent = z.object({
  accountId: z.string().uuid(),
  depositId: z.string().uuid(),
  currency: z.string().length(3),
  reason: z.string().optional(),
});

const WalletDepositConfirmedEvent = z.object({
  accountId: z.string().uuid(),
  depositId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().length(3),
});

const AdminDepositPendingEvent = z.object({
  depositId: z.string().uuid(),
  jobId: z.string().optional(),
  userId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  expectedBalance: z.number().optional(),
  confirmDeposit: z.any().optional(),
  confirmedEvent: z
    .object({
      accountId: z.string().uuid(),
      depositId: z.string().uuid(),
      amount: z.number(),
      currency: z.string().length(3),
    })
    .optional(),
});

const AdminDepositRejectedEvent = z.object({
  depositId: z.string().uuid(),
  reason: z.string().optional(),
});

const AdminDepositConfirmedEvent = z.object({
  depositId: z.string().uuid(),
});

export const EventSchemas = {
  "hand.start": HandStartEvent,
  "hand.end": HandEndEvent,
  "hand.settle": HandSettleEvent,
  "leaderboard.hand_settled": HandSettleEvent,
  "wallet.credit": WalletMovementEvent,
  "wallet.debit": WalletMovementEvent,
  "tournament.cancel": TournamentCancelEvent,
  "wallet.reserve": WalletReserveEvent,
  "wallet.rollback": WalletRollbackEvent,
  "wallet.commit": WalletCommitEvent,
  "auth.login": AuthLoginEvent,
  "antiCheat.flag": AntiCheatFlagEvent,
  "wallet.velocity.limit": WalletVelocityLimitEvent,
  "wallet.reconcile.mismatch": WalletReconcileMismatchEvent,
  "wallet.reconcile.mismatch.resolved": WalletReconcileMismatchAcknowledgedEvent,
  "wallet.chargeback_flag": WalletChargebackFlagEvent,
  "notification.create": NotificationCreateEvent,
  "wallet.deposit.rejected": WalletDepositRejectedEvent,
  "wallet.deposit.confirmed": WalletDepositConfirmedEvent,
  "admin.deposit.pending": AdminDepositPendingEvent,
  "admin.deposit.rejected": AdminDepositRejectedEvent,
  "admin.deposit.confirmed": AdminDepositConfirmedEvent,
} as const;

export type Events = {
  "hand.start": z.infer<typeof HandStartEvent>;
  "hand.end": z.infer<typeof HandEndEvent>;
  "hand.settle": z.infer<typeof HandSettleEvent>;
  "leaderboard.hand_settled": z.infer<typeof HandSettleEvent>;
  "wallet.credit": z.infer<typeof WalletMovementEvent>;
  "wallet.debit": z.infer<typeof WalletMovementEvent>;
  "tournament.cancel": z.infer<typeof TournamentCancelEvent>;
  "wallet.reserve": z.infer<typeof WalletReserveEvent>;
  "wallet.rollback": z.infer<typeof WalletRollbackEvent>;
  "wallet.commit": z.infer<typeof WalletCommitEvent>;
  "auth.login": z.infer<typeof AuthLoginEvent>;
  "antiCheat.flag": z.infer<typeof AntiCheatFlagEvent>;
  "wallet.velocity.limit": z.infer<typeof WalletVelocityLimitEvent>;
  "wallet.reconcile.mismatch": z.infer<typeof WalletReconcileMismatchEvent>;
  "wallet.reconcile.mismatch.resolved": z.infer<
    typeof WalletReconcileMismatchAcknowledgedEvent
  >;
  "wallet.chargeback_flag": z.infer<typeof WalletChargebackFlagEvent>;
  "notification.create": z.infer<typeof NotificationCreateEvent>;
  "wallet.deposit.rejected": z.infer<typeof WalletDepositRejectedEvent>;
  "wallet.deposit.confirmed": z.infer<typeof WalletDepositConfirmedEvent>;
  "admin.deposit.pending": z.infer<typeof AdminDepositPendingEvent>;
  "admin.deposit.rejected": z.infer<typeof AdminDepositRejectedEvent>;
  "admin.deposit.confirmed": z.infer<typeof AdminDepositConfirmedEvent>;
};

export type EventName = keyof Events;
