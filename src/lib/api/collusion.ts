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
  ReviewStatus,
  ReviewActionLogsResponse,
  ReviewActionLogsResponseSchema,
} from '@shared/types';

export async function listFlaggedSessions(
  token: string,
  page = 1,
  status?: ReviewStatus,
): Promise<FlaggedSessionsResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (status) params.set('status', status);
  return handleResponse(
    serverFetch(
      `${getBaseUrl()}/api/analytics/collusion/flagged?${params.toString()}`,
      {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      },
    ),
    FlaggedSessionsResponseSchema,
  );
}

export async function getActionHistory(
  id: string,
  token: string,
): Promise<ReviewActionLogsResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/analytics/collusion/${id}/audit`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }),
    ReviewActionLogsResponseSchema,
  );
}

export async function applyAction(
  id: string,
  action: ReviewAction,
  token: string,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/analytics/collusion/${id}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    }),
    MessageResponseSchema,
  );
}
