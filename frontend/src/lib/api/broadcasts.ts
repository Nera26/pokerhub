import { apiClient, ApiError } from './client';
import {
  BroadcastSchema,
  BroadcastsResponseSchema,
  type Broadcast,
  type BroadcastsResponse,
  type SendBroadcastRequest,
  BroadcastTemplatesResponseSchema,
  type BroadcastTemplatesResponse,
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
} from '@shared/types';

export async function fetchBroadcasts({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BroadcastsResponse> {
  try {
    return await apiClient('/api/admin/broadcasts', BroadcastsResponseSchema, {
      signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch broadcasts: ${message}` } as ApiError;
  }
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
  try {
    return await apiClient(
      '/api/broadcast/templates',
      BroadcastTemplatesResponseSchema,
      { signal },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw {
      message: `Failed to fetch broadcast templates: ${message}`,
    } as ApiError;
  }
}

export async function fetchBroadcastTypes({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BroadcastTypesResponse> {
  try {
    return await apiClient(
      '/api/broadcasts/types',
      BroadcastTypesResponseSchema,
      { signal },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw {
      message: `Failed to fetch broadcast types: ${message}`,
    } as ApiError;
  }
}
