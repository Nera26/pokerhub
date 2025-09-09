import { apiClient } from './client';
export type { ApiError } from './client';
import {
  FlaggedSessionsResponse,
  FlaggedSessionsResponseSchema,
  ReviewAction,
  ReviewStatus,
  ReviewActionLogsResponse,
  ReviewActionLogsResponseSchema,
  ReviewActionLog,
  ReviewActionLogSchema,
  MessageResponseSchema,
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

const ReviewActionResponseSchema = ReviewActionLogSchema.or(
  MessageResponseSchema,
);

export async function applyAction(
  id: string,
  action: ReviewAction,
  token: string,
  reviewerId: string,
): Promise<ReviewActionLog> {
  const res = await apiClient(
    `/api/analytics/collusion/${id}/${action}`,
    ReviewActionResponseSchema,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
  );
  if ('reviewerId' in res && 'timestamp' in res) {
    return res;
  }
  return {
    action: res.message as ReviewAction,
    reviewerId,
    timestamp: Date.now(),
  };
}
