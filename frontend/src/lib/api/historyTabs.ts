import { HistoryTabsResponseSchema, type HistoryTabItem } from '@shared/types';
import { fetchList } from './fetchList';

export async function fetchHistoryTabs({
  signal,
}: { signal?: AbortSignal } = {}): Promise<HistoryTabItem[]> {
  const { tabs } = await fetchList(
    '/api/history-tabs',
    HistoryTabsResponseSchema,
    { signal },
  );
  return tabs;
}

export type { ApiError } from './client';
export type { HistoryTabItem };
