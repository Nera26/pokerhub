/* istanbul ignore file */
import { apiClient } from './client';
import {
  AmountSchema,
  MessageResponseSchema,
  WithdrawRequestSchema,
  DepositRequestSchema,
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
  return apiClient(path, MessageResponseSchema, {
    method: 'POST',
    body: { amount, currency },
    signal,
  });
}

export function reserve(
  playerId: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(
    `/api/wallet/${playerId}/reserve`,
    amount,
    currency,
    opts.signal,
  );
}

export function commit(
  playerId: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(
    `/api/wallet/${playerId}/commit`,
    amount,
    currency,
    opts.signal,
  );
}

export function rollback(
  playerId: string,
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount(
    `/api/wallet/${playerId}/rollback`,
    amount,
    currency,
    opts.signal,
  );
}

export function withdraw(
  playerId: string,
  amount: number,
  deviceId: string,
  currency: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletStatusResponse> {
  const payload = WithdrawRequestSchema.parse({ amount, deviceId, currency });
  return apiClient(
    `/api/wallet/${playerId}/withdraw`,
    WalletStatusResponseSchema,
    {
      method: 'POST',
      body: payload,
      signal: opts.signal,
    },
  );
}

export function deposit(
  playerId: string,
  amount: number,
  deviceId: string,
  currency: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletStatusResponse> {
  const payload = DepositRequestSchema.parse({ amount, deviceId, currency });
  return apiClient(
    `/api/wallet/${playerId}/deposit`,
    WalletStatusResponseSchema,
    {
      method: 'POST',
      body: payload,
      signal: opts.signal,
    },
  );
}

export function getStatus(
  playerId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletStatusResponse> {
  return apiClient(`/api/wallet/${playerId}/status`, WalletStatusResponseSchema, {
    signal: opts.signal,
  });
}

export function fetchTransactions(
  playerId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletTransactionsResponse> {
  return apiClient(
    `/api/wallet/${playerId}/transactions`,
    WalletTransactionsResponseSchema,
    {
      signal: opts.signal,
    },
  );
}

export function fetchPending(
  playerId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<PendingTransactionsResponse> {
  return apiClient(`/api/wallet/${playerId}/pending`, PendingTransactionsResponseSchema, {
    signal: opts.signal,
  });
}
