import { z } from 'zod';

export const HandStartEventSchema = z.object({
  event: z.literal('hand.start'),
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  startedAt: z.coerce.date(),
});
export type HandStartEvent = z.infer<typeof HandStartEventSchema>;

export const WalletCreditEventSchema = z.object({
  event: z.literal('wallet.credit'),
  walletId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  creditedAt: z.coerce.date(),
});
export type WalletCreditEvent = z.infer<typeof WalletCreditEventSchema>;

export const EventSchemas = {
  'hand.start': HandStartEventSchema,
  'wallet.credit': WalletCreditEventSchema,
};

export type Event = HandStartEvent | WalletCreditEvent;
