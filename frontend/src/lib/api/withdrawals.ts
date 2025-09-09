/* istanbul ignore file */
import { apiClient } from './client';
import { z } from 'zod';
import {
  PendingWithdrawalsResponseSchema,
  type WithdrawalDecisionRequest,
} from '@shared/types';

export type { ApiError } from './client';

const PendingWithdrawalSchema =
  PendingWithdrawalsResponseSchema.shape.withdrawals.element;
export type PendingWithdrawal = z.infer<typeof PendingWithdrawalSchema>;

export async function approveWithdrawal(
  id: string,
  comment: string,
): Promise<PendingWithdrawal> {
  const body: WithdrawalDecisionRequest = { comment };
  return apiClient(`/api/withdrawals/${id}/approve`, PendingWithdrawalSchema, {
    method: 'POST',
    body,
  });
}

export async function rejectWithdrawal(
  id: string,
  comment: string,
): Promise<PendingWithdrawal> {
  const body: WithdrawalDecisionRequest = { comment };
  return apiClient(`/api/withdrawals/${id}/reject`, PendingWithdrawalSchema, {
    method: 'POST',
    body,
  });
}

export async function fetchPendingWithdrawals({
  signal,
}: { signal?: AbortSignal } = {}) {
  const res = await apiClient(
    '/api/admin/withdrawals',
    PendingWithdrawalsResponseSchema,
    { signal },
  );
  return res.withdrawals;
}
