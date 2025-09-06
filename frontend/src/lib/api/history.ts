import { z } from 'zod';
import { apiClient } from './client';

const GameHistoryEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  stakes: z.string(),
  buyin: z.string(),
  date: z.string(),
  profit: z.boolean(),
  amount: z.string(),
});
export type GameHistoryEntry = z.infer<typeof GameHistoryEntrySchema>;

export function fetchGameHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<GameHistoryEntry[]> {
  return apiClient('/api/history/games', z.array(GameHistoryEntrySchema), {
    signal: opts.signal,
  });
}

const TournamentHistoryEntrySchema = z.object({
  name: z.string(),
  place: z.string(),
  buyin: z.string(),
  prize: z.string(),
  duration: z.string(),
});
export type TournamentHistoryEntry = z.infer<
  typeof TournamentHistoryEntrySchema
>;

export function fetchTournamentHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<TournamentHistoryEntry[]> {
  return apiClient(
    '/api/history/tournaments',
    z.array(TournamentHistoryEntrySchema),
    { signal: opts.signal },
  );
}

const TransactionEntrySchema = z.object({
  date: z.string(),
  type: z.string(),
  amount: z.string(),
  status: z.string(),
});
export type TransactionEntry = z.infer<typeof TransactionEntrySchema>;

export function fetchTransactions(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionEntry[]> {
  return apiClient(
    '/api/history/transactions',
    z.array(TransactionEntrySchema),
    { signal: opts.signal },
  );
}
