import { z } from 'zod';

/** ---- /hands/:id/proof ---- */
export const HandProofResponse = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
  deck: z.array(z.number()).optional(),
});
export type HandProofResponse = z.infer<typeof HandProofResponse>;

export const HandProofsResponse = z.array(
  z.object({
    id: z.string(),
    proof: HandProofResponse,
  }),
);
export type HandProofsResponse = z.infer<typeof HandProofsResponse>;

/** ---- /hands/:id/log (plain text JSONL) ---- */
export const HandLogResponse = z.string();
export type HandLogResponse = z.infer<typeof HandLogResponse>;

/** ---- /hands/:id/state/:actionIndex ---- */
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
    z.object({
      amount: z.number(),
      players: z.array(z.string()),
    }),
  ),
  currentBet: z.number(),
  players: z.array(PlayerState),
});
export type HandStateResponse = z.infer<typeof HandStateResponse>;
