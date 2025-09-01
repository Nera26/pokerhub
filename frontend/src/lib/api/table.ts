import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
export { join, bet, buyIn, sitOut, rebuy } from '@/lib/socket';
import {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  type TableData,
} from '@shared/types';

export { PlayerSchema, ChatMessageSchema, TableDataSchema };
export type { TableData };

export async function fetchTable(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableData> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  });
  return handleResponse(res, TableDataSchema);
}
