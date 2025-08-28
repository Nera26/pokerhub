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
    serverFetch(`${getBaseUrl()}/api/review/sessions`, {
      credentials: 'include',
    }),
    FlaggedSessionsResponseSchema,
  );
}

export async function applyReviewAction(
  id: string,
  action: ReviewAction,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/review/sessions/${id}/${action}`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}
