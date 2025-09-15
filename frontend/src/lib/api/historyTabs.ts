import { HistoryTabItemSchema, type HistoryTabItem } from '@shared/types';
import { fetchList } from './fetchList';

export function fetchHistoryTabs({
  signal,
}: { signal?: AbortSignal } = {}): Promise<HistoryTabItem[]> {
  return fetchList('/api/history-tabs', HistoryTabItemSchema, { signal });
}

export type { ApiError } from './client';
export type { HistoryTabItem };
