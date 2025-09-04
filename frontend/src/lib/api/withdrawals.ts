/* istanbul ignore file */
import { apiClient } from './client';
import {
  MessageResponse,
  MessageResponseSchema,
  WithdrawalDecisionRequest,
} from '@shared/types';
export type { ApiError } from './client';

export async function approveWithdrawal(
  user: string,
  comment: string,
): Promise<MessageResponse> {
  const body: WithdrawalDecisionRequest = { comment };
  return apiClient(`/api/withdrawals/${user}/approve`, MessageResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function rejectWithdrawal(
  user: string,
  comment: string,
): Promise<MessageResponse> {
  const body: WithdrawalDecisionRequest = { comment };
  return apiClient(`/api/withdrawals/${user}/reject`, MessageResponseSchema, {
    method: 'POST',
    body,
  });
}

export async function reserveFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return apiClient(`/api/wallet/${user}/reserve`, MessageResponseSchema, {
    method: 'POST',
    body: { amount },
  });
}

export async function commitFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return apiClient(`/api/wallet/${user}/commit`, MessageResponseSchema, {
    method: 'POST',
    body: { amount },
  });
}

export async function rollbackFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return apiClient(`/api/wallet/${user}/rollback`, MessageResponseSchema, {
    method: 'POST',
    body: { amount },
  });
}
