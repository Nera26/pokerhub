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

export async function listFlaggedSessions(
  token: string,
): Promise<FlaggedSessionsResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/review/sessions`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }),
    FlaggedSessionsResponseSchema,
  );
}

export async function applyAction(
  id: string,
  action: ReviewAction,
  token: string,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/review/sessions/${id}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }),
    MessageResponseSchema,
  );
}
