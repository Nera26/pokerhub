import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { MessageResponse, MessageResponseSchema } from './schemas';
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
