import { z, type ZodTypeAny } from 'zod';
import { CurrencySchema } from '../wallet.schema';

export const HistoryQuerySchema = z.object({
  gameType: z.string().optional(),
  profitLoss: z.enum(['win', 'loss']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['asc', 'desc']).optional(),
});
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;

export const PaginatedResponseSchema = <T extends ZodTypeAny>(schema: T) =>
  z.object({
    items: z.array(schema),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative().optional(),
  });

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

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

