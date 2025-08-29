import { z } from "zod";

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

export const EventSchemas = {
  "hand.start": HandStartEvent,
  "hand.end": HandEndEvent,
  "wallet.credit": WalletMovementEvent,
  "wallet.debit": WalletMovementEvent,
  "action.bet": ActionBetEvent,
  "action.call": ActionCallEvent,
  "action.fold": ActionFoldEvent,
  "tournament.register": TournamentRegisterEvent,
  "tournament.eliminate": TournamentEliminateEvent,
  "wallet.reserve": WalletReserveEvent,
  "wallet.commit": WalletCommitEvent,
  "antiCheat.flag": AntiCheatFlagEvent,
  "wallet.velocity.limit": WalletVelocityLimitEvent,
} as const;

export type Events = {
  "hand.start": z.infer<typeof HandStartEvent>;
  "hand.end": z.infer<typeof HandEndEvent>;
  "wallet.credit": z.infer<typeof WalletMovementEvent>;
  "wallet.debit": z.infer<typeof WalletMovementEvent>;
  "action.bet": z.infer<typeof ActionBetEvent>;
  "action.call": z.infer<typeof ActionCallEvent>;
  "action.fold": z.infer<typeof ActionFoldEvent>;
  "tournament.register": z.infer<typeof TournamentRegisterEvent>;
  "tournament.eliminate": z.infer<typeof TournamentEliminateEvent>;
  "wallet.reserve": z.infer<typeof WalletReserveEvent>;
  "wallet.commit": z.infer<typeof WalletCommitEvent>;
  "antiCheat.flag": z.infer<typeof AntiCheatFlagEvent>;
  "wallet.velocity.limit": z.infer<typeof WalletVelocityLimitEvent>;
};

export type EventName = keyof Events;
