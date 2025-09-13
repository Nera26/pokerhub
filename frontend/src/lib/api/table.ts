import { apiClient } from './client';
import { z } from 'zod';
import {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  TableStateSchema,
  SendChatMessageRequestSchema,
  TableSchema,
  TableListSchema,
  type TableData,
  type TableState,
  type SendChatMessageRequest,
  type Table,
  type TableList,
  type CreateTableRequest,
  type UpdateTableRequest,
  TabKeySchema,
  TableTabsResponseSchema,
  type TabKey,
} from '@shared/types';

export {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  TableStateSchema,
  SendChatMessageRequestSchema,
  TableSchema,
  TableListSchema,
  TabKeySchema,
  TableTabsResponseSchema,
};
export type {
  TableData,
  TableState,
  SendChatMessageRequest,
  Table,
  TableList,
  CreateTableRequest,
  UpdateTableRequest,
  TabKey,
};

const HandSummarySchema = z.object({
  id: z.string(),
});
export type HandSummary = z.infer<typeof HandSummarySchema>;
export { HandSummarySchema };

export async function fetchTables({
  signal,
  status,
}: { signal?: AbortSignal; status?: string } = {}): Promise<TableList> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient(`/api/tables${query}`, TableListSchema, {
    signal,
    cache: 'no-store',
  });
}

export async function fetchTable(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableData> {
  return apiClient(`/api/tables/${id}`, TableDataSchema, {
    signal,
    cache: 'no-store',
  });
}

export async function fetchTableState(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableState> {
  return apiClient(`/api/tables/${id}/state`, TableStateSchema, {
    signal,
    cache: 'no-store',
  });
}

export async function fetchTableHands(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandSummary[]> {
  return apiClient(`/api/table/${id}/hands`, z.array(HandSummarySchema), {
    signal,
    cache: 'no-store',
  });
}

export async function fetchSidePanelTabs(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TabKey[]> {
  return apiClient(`/api/tables/${id}/tabs`, TableTabsResponseSchema, {
    signal,
    cache: 'no-store',
  });
}

export async function sendChatMessage(
  id: string,
  body: SendChatMessageRequest,
): Promise<void> {
  await apiClient(`/api/tables/${id}/chat`, z.void(), {
    method: 'POST',
    body,
  });
}

export async function createTable(body: CreateTableRequest): Promise<Table> {
  return apiClient('/api/tables', TableSchema, {
    method: 'POST',
    body,
  });
}

export async function updateTable(
  id: string,
  body: UpdateTableRequest,
): Promise<Table> {
  return apiClient(`/api/tables/${id}`, TableSchema, {
    method: 'PUT',
    body,
  });
}

export async function deleteTable(id: string): Promise<void> {
  await apiClient(`/api/tables/${id}`, z.void(), {
    method: 'DELETE',
  });
}
