import { type ZodType } from 'zod';
import { fetchList } from './fetchList';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@shared/types';

export type { GameHistoryEntry, TournamentHistoryEntry, TransactionEntry };

function createHistoryFetcher<T>(path: string, schema: ZodType<T>) {
  return (opts: { signal?: AbortSignal } = {}): Promise<T[]> =>
    fetchList(path, schema, opts);
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
