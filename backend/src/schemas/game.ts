import { z } from 'zod';

export const GameActionSchema = z.object({
  type: z.enum(['join', 'bet']),
  tableId: z.string(),
  amount: z.number().int().positive().optional(),
});

export type GameAction = z.infer<typeof GameActionSchema>;
