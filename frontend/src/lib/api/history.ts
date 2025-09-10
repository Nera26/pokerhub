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

export function fetchGameHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<GameHistoryEntry[]> {
  return apiClient('/api/history/games', z.array(GameHistoryEntrySchema), {
    signal: opts.signal,
  });
}

export function fetchTournamentHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<TournamentHistoryEntry[]> {
  return apiClient(
    '/api/history/tournaments',
    z.array(TournamentHistoryEntrySchema),
    { signal: opts.signal },
  );
}

export function fetchTransactions(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionEntry[]> {
  return apiClient(
    '/api/history/transactions',
    z.array(TransactionEntrySchema),
    { signal: opts.signal },
  );
}
