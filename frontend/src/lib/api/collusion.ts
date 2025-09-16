import { apiClient } from './client';
import { getAuthToken } from '@/context/AuthContext';
import type { ApiError } from '@shared/utils/http';
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

function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw { status: 401, message: 'Unauthorized' } satisfies ApiError;
  }
  return token;
}

export async function listFlaggedSessions(
  page = 1,
  status?: ReviewStatus,
): Promise<FlaggedSessionsResponse> {
  const token = requireAuthToken();
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
): Promise<ReviewActionLogsResponse> {
  const token = requireAuthToken();
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
  reviewerId: string,
): Promise<ReviewActionLog> {
  const token = requireAuthToken();
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
