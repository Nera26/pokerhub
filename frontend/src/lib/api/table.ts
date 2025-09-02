import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { z } from 'zod';
export { join, bet, buyIn, sitOut, rebuy } from '@/lib/socket';
import {
  PlayerSchema,
  ChatMessageSchema,
  TableDataSchema,
  SendChatMessageRequestSchema,
  ChatMessagesResponseSchema,
  TableSchema,
  type TableData,
  type SendChatMessageRequest,
  type ChatMessagesResponse,
  type Table,
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
};
export type {
  TableData,
  SendChatMessageRequest,
  ChatMessagesResponse,
  Table,
  CreateTableRequest,
  UpdateTableRequest,
};

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

export async function fetchChatMessages(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<ChatMessagesResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}/chat`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  });
  return handleResponse(res, ChatMessagesResponseSchema);
}

export async function sendChatMessage(
  id: string,
  body: SendChatMessageRequest,
): Promise<void> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}/chat`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  await handleResponse(res, z.void());
}

export async function createTable(
  body: CreateTableRequest,
): Promise<Table> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res, TableSchema);
}

export async function updateTable(
  id: string,
  body: UpdateTableRequest,
): Promise<Table> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res, TableSchema);
}

export async function deleteTable(id: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(res, z.void());
}
