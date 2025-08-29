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
  WalletTransactionsResponseSchema,
  PendingTransactionsResponseSchema,
  type WalletTransactionsResponse,
  type PendingTransactionsResponse,
} from '@shared/types';

/* istanbul ignore next */
async function postAmount(
  path: string,
  amount: number,
  currency: string,
  signal?: AbortSignal,
): Promise<MessageResponse> {
  AmountSchema.parse({ amount, currency });
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount, currency }),
    signal,
  });
  return handleResponse(res, MessageResponseSchema);
}

export function reserve(
  id: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(`/api/wallet/${id}/reserve`, amount, currency, opts.signal);
}

export function commit(
  id: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(`/api/wallet/${id}/commit`, amount, currency, opts.signal);
}

export function rollback(
  id: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(`/api/wallet/${id}/rollback`, amount, currency, opts.signal);
}

export function withdraw(
  id: string,
  amount: number,
  deviceId: string,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  const payload = WithdrawRequestSchema.parse({ amount, deviceId, currency });
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

export function fetchTransactions(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletTransactionsResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/wallet/${id}/transactions`, {
    credentials: 'include',
    signal: opts.signal,
  });
  return handleResponse(res, WalletTransactionsResponseSchema);
}

export function fetchPending(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<PendingTransactionsResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/wallet/${id}/pending`, {
    credentials: 'include',
    signal: opts.signal,
  });
  return handleResponse(res, PendingTransactionsResponseSchema);
}
