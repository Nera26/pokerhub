import { z } from 'zod';

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

export const EventSchemas = {
  'hand.start': HandStartEvent,
  'hand.end': HandEndEvent,
  'wallet.credit': WalletMovementEvent,
  'wallet.debit': WalletMovementEvent,
};

export type Events = {
  'hand.start': z.infer<typeof HandStartEvent>;
  'hand.end': z.infer<typeof HandEndEvent>;
  'wallet.credit': z.infer<typeof WalletMovementEvent>;
  'wallet.debit': z.infer<typeof WalletMovementEvent>;
};

export type EventName = keyof Events;

