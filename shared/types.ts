import { z } from 'zod';

export const StatusResponseSchema = z.object({
  status: z.string(),
});
export type StatusResponse = z.infer<typeof StatusResponseSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
});
export type Amount = z.infer<typeof AmountSchema>;

export const GameActionSchema = z.object({
  type: z.enum(['join', 'bet']),
  tableId: z.string(),
  amount: z.number().int().positive().optional(),
});
export type GameAction = z.infer<typeof GameActionSchema>;

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

export const LeaderboardResponseSchema = z.array(z.string());
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
