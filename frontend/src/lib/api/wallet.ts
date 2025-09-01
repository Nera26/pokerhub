/* istanbul ignore file */
import { apiClient } from './client';
import {
  AmountSchema,
  MessageResponseSchema,
  WithdrawRequestSchema,
  DepositRequestSchema,
  ProviderChallengeSchema,
  type MessageResponse,
  type ProviderChallenge,
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
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount('/api/wallet/reserve', amount, currency, opts.signal);
}

export function commit(
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount('/api/wallet/commit', amount, currency, opts.signal);
}

export function rollback(
  amount: number,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  return postAmount('/api/wallet/rollback', amount, currency, opts.signal);
}

export function withdraw(
  amount: number,
  deviceId: string,
  currency: string,
  opts: { signal?: AbortSignal } = {},
) {
  const payload = WithdrawRequestSchema.parse({ amount, deviceId, currency });
  return apiClient('/api/wallet/withdraw', MessageResponseSchema, {
    method: 'POST',
    body: payload,
    signal: opts.signal,
  });
}

export function deposit(
  amount: number,
  deviceId: string,
  currency: string,
  opts: { signal?: AbortSignal } = {},
): Promise<ProviderChallenge> {
  const payload = DepositRequestSchema.parse({ amount, deviceId, currency });
  return apiClient('/api/wallet/deposit', ProviderChallengeSchema, {
    method: 'POST',
    body: payload,
    signal: opts.signal,
  });
}

export function getStatus(
  opts: { signal?: AbortSignal } = {},
): Promise<WalletStatusResponse> {
  return apiClient('/api/wallet/status', WalletStatusResponseSchema, {
    signal: opts.signal,
  });
}

export function fetchTransactions(
  opts: { signal?: AbortSignal } = {},
): Promise<WalletTransactionsResponse> {
  return apiClient('/api/wallet/transactions', WalletTransactionsResponseSchema, {
    signal: opts.signal,
  });
}

export function fetchPending(
  opts: { signal?: AbortSignal } = {},
): Promise<PendingTransactionsResponse> {
  return apiClient('/api/wallet/pending', PendingTransactionsResponseSchema, {
    signal: opts.signal,
  });
}
