import { apiClient } from './client';
import { safeApiClient } from './utils';
import {
  BroadcastSchema,
  BroadcastsResponseSchema,
  type Broadcast,
  type BroadcastsResponse,
  type SendBroadcastRequest,
  BroadcastTemplatesResponseSchema,
  type BroadcastTemplatesResponse,
} from '@shared/types';

export async function fetchBroadcasts({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BroadcastsResponse> {
  return safeApiClient('/api/admin/broadcasts', BroadcastsResponseSchema, {
    signal,
    errorMessage: 'Failed to fetch broadcasts',
  });
}

export async function sendBroadcast(
  body: SendBroadcastRequest,
): Promise<Broadcast> {
  return apiClient('/api/admin/broadcasts', BroadcastSchema, {
    method: 'POST',
    body,
  });
}

export async function fetchBroadcastTemplates({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BroadcastTemplatesResponse> {
  return safeApiClient(
    '/api/broadcast/templates',
    BroadcastTemplatesResponseSchema,
    {
      signal,
      errorMessage: 'Failed to fetch broadcast templates',
    },
  );
}
