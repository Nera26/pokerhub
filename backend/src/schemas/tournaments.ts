import { z } from 'zod';

export const AdminTournamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  gameType: z.string(),
  buyin: z.number(),
  fee: z.number(),
  prizePool: z.number(),
  date: z.string(),
  time: z.string(),
  format: z.enum(['Regular', 'Turbo', 'Deepstack', 'Bounty', 'Freeroll']),
  seatCap: z.union([z.number().int().positive(), z.literal('')]).optional(),
  description: z.string().optional(),
  rebuy: z.boolean(),
  addon: z.boolean(),
  status: z.enum(['scheduled', 'running', 'finished', 'cancelled', 'auto-start']),
});

export type AdminTournament = z.infer<typeof AdminTournamentSchema>;
