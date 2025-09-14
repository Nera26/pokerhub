import { HistoryTabsResponseSchema, type HistoryTabItem } from '@shared/types';
import { safeApiClient } from './utils';

export async function fetchHistoryTabs({
  signal,
}: { signal?: AbortSignal } = {}): Promise<HistoryTabItem[]> {
  const { tabs } = await safeApiClient(
    '/api/history-tabs',
    HistoryTabsResponseSchema,
    { signal, errorMessage: 'Failed to fetch history tabs' },
  );
  return tabs;
}

export type { ApiError } from './client';
export type { HistoryTabItem };
