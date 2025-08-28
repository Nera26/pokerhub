/* istanbul ignore file */
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { MessageResponse, MessageResponseSchema } from '@shared/types';
export type { ApiError } from './client';

export async function approveWithdrawal(
  user: string,
  comment: string,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/withdrawals/${user}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ comment }),
    }),
    MessageResponseSchema,
  );
}

export async function rejectWithdrawal(
  user: string,
  comment: string,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/withdrawals/${user}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ comment }),
    }),
    MessageResponseSchema,
  );
}

export async function reserveFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/wallet/${user}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    }),
    MessageResponseSchema,
  );
}

export async function commitFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/wallet/${user}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    }),
    MessageResponseSchema,
  );
}

export async function rollbackFunds(
  user: string,
  amount: number,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/wallet/${user}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount }),
    }),
    MessageResponseSchema,
  );
}
