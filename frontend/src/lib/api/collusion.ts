import { apiClient } from './client';
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
  return apiClient(
    `/api/analytics/collusion/flagged?${params.toString()}`,
    FlaggedSessionsResponseSchema,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function getActionHistory(
  id: string,
  token: string,
): Promise<ReviewActionLogsResponse> {
  return apiClient(
    `/api/analytics/collusion/${id}/audit`,
    ReviewActionLogsResponseSchema,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function applyAction(
  id: string,
  action: ReviewAction,
  token: string,
): Promise<MessageResponse> {
  return apiClient(
    `/api/analytics/collusion/${id}/${action}`,
    MessageResponseSchema,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
  );
}
