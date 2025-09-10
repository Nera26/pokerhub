import { z } from 'zod';

export const GameHistoryEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  stakes: z.string(),
  buyin: z.string(),
  date: z.string(),
  profit: z.boolean(),
  amount: z.string(),
});
export type GameHistoryEntry = z.infer<typeof GameHistoryEntrySchema>;

export const TournamentHistoryEntrySchema = z.object({
  name: z.string(),
  place: z.string(),
  buyin: z.string(),
  prize: z.string(),
  duration: z.string(),
});
export type TournamentHistoryEntry = z.infer<
  typeof TournamentHistoryEntrySchema
>;

export const TransactionEntrySchema = z.object({
  date: z.string(),
  type: z.string(),
  amount: z.string(),
  status: z.string(),
});
export type TransactionEntry = z.infer<typeof TransactionEntrySchema>;

