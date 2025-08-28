import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
export type { ApiError } from './client';
import {
  FlaggedSessionsResponse,
  FlaggedSessionsResponseSchema,
  MessageResponse,
  MessageResponseSchema,
  ReviewAction,
} from '@shared/types';

export async function listFlaggedSessions(): Promise<FlaggedSessionsResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/admin/collusion/flags`, {
      credentials: 'include',
    }),
    FlaggedSessionsResponseSchema,
  );
}

export async function applyAction(
  id: string,
  action: ReviewAction,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/admin/collusion/${id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }),
    MessageResponseSchema,
  );
}
