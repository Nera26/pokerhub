import { z } from 'zod';

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
