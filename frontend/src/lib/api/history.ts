import { type ZodType } from 'zod';
import { fetchList } from './fetchList';
import { apiClient } from './client';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  TournamentBracketResponseSchema,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
  type TournamentBracketResponse,
} from '@shared/types';

export type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
  TournamentBracketResponse,
};

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

export function fetchTournamentBracket(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<TournamentBracketResponse> {
  return apiClient(
    `/api/history/tournaments/${id}/bracket`,
    TournamentBracketResponseSchema,
    { signal: opts.signal },
  );
}
