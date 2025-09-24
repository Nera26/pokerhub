import { z } from 'zod';
import { CurrencySchema } from '../wallet.schema';

export const GameHistoryEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  stakes: z.string(),
  buyin: z.string(),
  date: z.string(),
  profit: z.boolean(),
  amount: z.number(),
  currency: CurrencySchema,
});
export type GameHistoryEntry = z.infer<typeof GameHistoryEntrySchema>;

export const TournamentHistoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  place: z.string(),
  buyin: z.string(),
  prize: z.string(),
  duration: z.string(),
});
export type TournamentHistoryEntry = z.infer<
  typeof TournamentHistoryEntrySchema
>;

export const TournamentBracketMatchSchema = z.object({
  id: z.string(),
  players: z.array(z.string()),
  winner: z.string().nullable(),
});

export const TournamentBracketRoundSchema = z.object({
  name: z.string(),
  matches: z.array(TournamentBracketMatchSchema),
});

export const TournamentBracketResponseSchema = z.object({
  tournamentId: z.string(),
  rounds: z.array(TournamentBracketRoundSchema),
});
export type TournamentBracketResponse = z.infer<
  typeof TournamentBracketResponseSchema
>;

export const TransactionEntrySchema = z.object({
  date: z.string(),
  type: z.string(),
  amount: z.number(),
  currency: CurrencySchema,
  status: z.string(),
});
export type TransactionEntry = z.infer<typeof TransactionEntrySchema>;

export const HistoryTabItemSchema = z.object({
  key: z.string(),
  label: z.string(),
});
export type HistoryTabItem = z.infer<typeof HistoryTabItemSchema>;

export const HistoryTabsResponseSchema = z.object({
  tabs: z.array(HistoryTabItemSchema),
});
export type HistoryTabsResponse = z.infer<typeof HistoryTabsResponseSchema>;

