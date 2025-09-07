import { apiClient } from './client';
import { z } from 'zod';
import {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  SendChatMessageRequestSchema,
  ChatMessagesResponseSchema,
  TableSchema,
  TableListSchema,
  type TableData,
  type SendChatMessageRequest,
  type ChatMessagesResponse,
  type Table,
  type TableList,
  type CreateTableRequest,
  type UpdateTableRequest,
} from '@shared/types';

export {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  SendChatMessageRequestSchema,
  ChatMessagesResponseSchema,
  TableSchema,
  TableListSchema,
};
export type {
  TableData,
  SendChatMessageRequest,
  ChatMessagesResponse,
  Table,
  TableList,
  CreateTableRequest,
  UpdateTableRequest,
};

const HandSummarySchema = z.object({
  id: z.string(),
});
export type HandSummary = z.infer<typeof HandSummarySchema>;
export { HandSummarySchema };

export async function fetchTables(
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableList> {
  return apiClient('/api/tables', TableListSchema, {
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

export async function fetchChatMessages(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<ChatMessagesResponse> {
  return apiClient(`/api/tables/${id}/chat`, ChatMessagesResponseSchema, {
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

export async function sendChatMessage(
  id: string,
  body: SendChatMessageRequest,
): Promise<void> {
  await apiClient(`/api/tables/${id}/chat`, z.void(), {
    method: 'POST',
    body,
  });
}

export async function createTable(
  body: CreateTableRequest,
): Promise<Table> {
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
