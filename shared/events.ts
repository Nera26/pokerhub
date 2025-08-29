import { z } from "zod";

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
});

export const WalletCommitEvent = z.object({
  refId: z.string(),
  amount: z.number(),
  rake: z.number(),
});

export const AntiCheatFlagEvent = z.object({
  accountId: z.string().uuid(),
  operation: z.enum(["deposit", "withdraw"]),
  amount: z.number(),
  dailyTotal: z.number(),
  limit: z.number(),
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
};

export type EventName = keyof Events;
