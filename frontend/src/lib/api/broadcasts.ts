import { apiClient, ApiError } from './client';
import {
  BroadcastSchema,
  BroadcastsResponseSchema,
  type Broadcast,
  type BroadcastsResponse,
  type SendBroadcastRequest,
} from '@shared/types';

export async function fetchBroadcasts({ signal }: { signal?: AbortSignal } = {}): Promise<BroadcastsResponse> {
  try {
    return await apiClient('/api/admin/broadcasts', BroadcastsResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch broadcasts: ${message}` } as ApiError;
  }
}

export async function sendBroadcast(body: SendBroadcastRequest): Promise<Broadcast> {
  return apiClient('/api/admin/broadcasts', BroadcastSchema, { method: 'POST', body });
}
