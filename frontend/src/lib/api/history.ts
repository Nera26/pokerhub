import { z } from 'zod';
import { apiClient } from './client';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@shared/types';

export type { GameHistoryEntry, TournamentHistoryEntry, TransactionEntry };

function createHistoryFetcher<T>(path: string, schema: z.ZodType<T>) {
  return (opts: { signal?: AbortSignal } = {}): Promise<T[]> =>
    apiClient(path, z.array(schema), { signal: opts.signal });
}

export const fetchGameHistory = createHistoryFetcher(
  '/api/history/games',
  GameHistoryEntrySchema,
);

export const fetchTournamentHistory = createHistoryFetcher(
  '/api/history/tournaments',
  TournamentHistoryEntrySchema,
);

export const fetchTransactions = createHistoryFetcher(
  '/api/history/transactions',
  TransactionEntrySchema,
);
