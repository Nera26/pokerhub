import { z } from 'zod';

export const HandProofResponse = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});

export type HandProofResponse = z.infer<typeof HandProofResponse>;

const PlayerState = z.object({
  id: z.string(),
  stack: z.number(),
  folded: z.boolean(),
  bet: z.number(),
  allIn: z.boolean(),
});

export const HandStateResponse = z.object({
  street: z.enum(['preflop', 'flop', 'turn', 'river', 'showdown']),
  pot: z.number(),
  sidePots: z.array(
    z.object({ amount: z.number(), players: z.array(z.string()) }),
  ),
  currentBet: z.number(),
  players: z.array(PlayerState),
});

export type HandStateResponse = z.infer<typeof HandStateResponse>;
