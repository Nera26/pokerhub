import { type ZodType } from 'zod';
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
  PaginatedResponseSchema,
  type Paginated,
} from '@shared/types';

export type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
  TournamentBracketResponse,
};

export interface HistoryQuery {
  gameType?: string;
  profitLoss?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
  sort?: 'asc' | 'desc';
}

async function fetchHistory<T>(
  path: string,
  schema: ZodType<T>,
  query?: HistoryQuery,
  opts: { signal?: AbortSignal } = {},
): Promise<Paginated<T>> {
  const qs = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qs.append(key, String(value));
      }
    });
  }

  const queryString = qs.toString();
  const url = queryString ? `${path}?${queryString}` : path;
  return apiClient(url, PaginatedResponseSchema(schema), {
    signal: opts.signal,
  });
}

export function fetchGameHistory(
  query?: HistoryQuery,
  opts: { signal?: AbortSignal } = {},
): Promise<Paginated<GameHistoryEntry>> {
  return fetchHistory(
    '/api/history/games',
    GameHistoryEntrySchema,
    query,
    opts,
  );
}

export function fetchTournamentHistory(
  query?: HistoryQuery,
  opts: { signal?: AbortSignal } = {},
): Promise<Paginated<TournamentHistoryEntry>> {
  return fetchHistory(
    '/api/history/tournaments',
    TournamentHistoryEntrySchema,
    query,
    opts,
  );
}

export function fetchTransactions(
  query?: HistoryQuery,
  opts: { signal?: AbortSignal } = {},
): Promise<Paginated<TransactionEntry>> {
  return fetchHistory(
    '/api/history/transactions',
    TransactionEntrySchema,
    query,
    opts,
  );
}

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
