import { type ZodType } from 'zod';
import { apiClient } from './client';
import {
  GameHistoryPageSchema,
  HistoryQuerySchema,
  TournamentHistoryPageSchema,
  TransactionHistoryPageSchema,
  TournamentBracketResponseSchema,
  type GameHistoryEntry,
  type GameHistoryPage,
  type HistoryQuery,
  type TournamentHistoryEntry,
  type TournamentHistoryPage,
  type TransactionEntry,
  type TransactionHistoryPage,
  type TournamentBracketResponse,
} from '@shared/types';

export type {
  GameHistoryEntry,
  GameHistoryPage,
  HistoryQuery,
  TournamentHistoryEntry,
  TournamentHistoryPage,
  TransactionEntry,
  TransactionHistoryPage,
  TournamentBracketResponse,
};

function buildQueryString(params: HistoryQuery = {}): string {
  const query = HistoryQuerySchema.parse(params);
  const search = new URLSearchParams();

  if (query.gameType) search.set('gameType', query.gameType);
  if (query.profitLoss) search.set('profitLoss', query.profitLoss);
  if (query.dateFrom) search.set('dateFrom', query.dateFrom);
  if (query.dateTo) search.set('dateTo', query.dateTo);
  if (typeof query.limit === 'number') search.set('limit', String(query.limit));
  if (query.cursor) search.set('cursor', query.cursor);

  return search.toString();
}

function createHistoryFetcher<R>(path: string, page: ZodType<R>) {
  return (
    params: HistoryQuery = {},
    opts: { signal?: AbortSignal } = {},
  ): Promise<R> => {
    const search = buildQueryString(params);
    const url = search ? `${path}?${search}` : path;
    return apiClient(url, page, { signal: opts.signal });
  };
}

export const fetchGameHistory = createHistoryFetcher(
  '/api/history/games',
  GameHistoryPageSchema,
);

export const fetchTournamentHistory = createHistoryFetcher(
  '/api/history/tournaments',
  TournamentHistoryPageSchema,
);

export const fetchTransactions = createHistoryFetcher(
  '/api/history/transactions',
  TransactionHistoryPageSchema,
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
