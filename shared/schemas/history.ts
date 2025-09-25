import { z } from 'zod';
import { CurrencySchema } from '../wallet.schema';

export const HistoryQuerySchema = z.object({
  gameType: z.string().min(1).optional(),
  profitLoss: z.enum(['win', 'loss']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>;

export const createHistoryPageSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    items: z.array(schema),
    nextCursor: z.string().optional(),
    total: z.number().int().nonnegative().optional(),
  });
export type HistoryPage<T> = {
  items: T[];
  nextCursor?: string;
  total?: number;
};

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
export const GameHistoryPageSchema = createHistoryPageSchema(
  GameHistoryEntrySchema,
);
export type GameHistoryPage = z.infer<typeof GameHistoryPageSchema>;

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
export const TournamentHistoryPageSchema = createHistoryPageSchema(
  TournamentHistoryEntrySchema,
);
export type TournamentHistoryPage = z.infer<
  typeof TournamentHistoryPageSchema
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
export const TransactionHistoryPageSchema = createHistoryPageSchema(
  TransactionEntrySchema,
);
export type TransactionHistoryPage = z.infer<
  typeof TransactionHistoryPageSchema
>;

export const HistoryTabItemSchema = z.object({
  key: z.string(),
  label: z.string(),
});
export type HistoryTabItem = z.infer<typeof HistoryTabItemSchema>;

export const HistoryTabsResponseSchema = z.object({
  tabs: z.array(HistoryTabItemSchema),
});
export type HistoryTabsResponse = z.infer<typeof HistoryTabsResponseSchema>;

