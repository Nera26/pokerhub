/* istanbul ignore file */
import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  AmountSchema,
  MessageResponseSchema,
  WithdrawRequestSchema,
  type MessageResponse,
  WalletStatusResponseSchema,
  type WalletStatusResponse,
} from '@shared/types';

/* istanbul ignore next */
async function postAmount(path: string, amount: number, signal?: AbortSignal): Promise<MessageResponse> {
  AmountSchema.parse({ amount });
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount }),
    signal,
  });
  return handleResponse(res, MessageResponseSchema);
}

export function reserve(id: string, amount: number, opts: { signal?: AbortSignal } = {}) {
  return postAmount(`/api/wallet/${id}/reserve`, amount, opts.signal);
}

export function commit(id: string, amount: number, opts: { signal?: AbortSignal } = {}) {
  return postAmount(`/api/wallet/${id}/commit`, amount, opts.signal);
}

export function rollback(id: string, amount: number, opts: { signal?: AbortSignal } = {}) {
  return postAmount(`/api/wallet/${id}/rollback`, amount, opts.signal);
}

export function withdraw(
  id: string,
  amount: number,
  deviceId: string,
  opts: { signal?: AbortSignal } = {},
) {
  const payload = WithdrawRequestSchema.parse({ amount, deviceId });
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/wallet/${id}/withdraw`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  return handleResponse(res, MessageResponseSchema);
}

export function getStatus(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletStatusResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/wallet/${id}/status`, {
    credentials: 'include',
    signal: opts.signal,
  });
  return handleResponse(res, WalletStatusResponseSchema);
}
