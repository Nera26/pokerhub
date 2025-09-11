import { HistoryTabsResponseSchema, type HistoryTabItem } from '@shared/types';
import { apiClient, type ApiError } from './client';

export async function fetchHistoryTabs({
  signal,
}: { signal?: AbortSignal } = {}): Promise<HistoryTabItem[]> {
  try {
    const { tabs } = await apiClient(
      '/api/history-tabs',
      HistoryTabsResponseSchema,
      { signal },
    );
    return tabs;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch history tabs: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
export type { HistoryTabItem };
