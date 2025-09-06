/* istanbul ignore file */
import { z } from 'zod';
import { apiClient } from './client';
import {
  AmountSchema,
  WithdrawRequestSchema,
  DepositRequestSchema,
  BankTransferDepositRequestSchema,
  BankTransferDepositResponseSchema,
  WalletStatusResponseSchema,
  WalletTransactionsResponseSchema,
  PendingTransactionsResponseSchema,
  PendingDepositsResponseSchema,
  DepositDecisionRequestSchema,
  IbanResponseSchema,
  IbanHistoryResponseSchema,
  type WalletStatusResponse,
  type WalletTransactionsResponse,
  type PendingTransactionsResponse,
  type PendingDepositsResponse,
  type IbanResponse,
  type IbanHistoryResponse,
} from '@shared/wallet.schema';
import {
  MessageResponseSchema,
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
  type MessageResponse,
  type PendingWithdrawalsResponse,
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

export function initiateBankTransfer(
  playerId: string,
  amount: number,
  deviceId: string,
  currency: string,
  idempotencyKey?: string,
  opts: { signal?: AbortSignal } = {},
) {
  const payload = BankTransferDepositRequestSchema.parse({
    amount,
    deviceId,
    currency,
    idempotencyKey,
  });
  return apiClient(
    `/api/wallet/${playerId}/deposit/bank-transfer`,
    BankTransferDepositResponseSchema,
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

export function fetchPendingDeposits(
  opts: { signal?: AbortSignal } = {},
): Promise<PendingDepositsResponse> {
  return apiClient(
    `/api/admin/deposits`,
    PendingDepositsResponseSchema,
    { signal: opts.signal },
  );
}

export function confirmDeposit(id: string, opts: { signal?: AbortSignal } = {}) {
  return apiClient(`/api/admin/deposits/${id}/confirm`, MessageResponseSchema, {
    method: 'POST',
    signal: opts.signal,
  });
}

export function rejectDeposit(
  id: string,
  reason: string | undefined,
  opts: { signal?: AbortSignal } = {},
) {
  const body = DepositDecisionRequestSchema.parse({ reason });
  return apiClient(`/api/admin/deposits/${id}/reject`, MessageResponseSchema, {
    method: 'POST',
    body,
    signal: opts.signal,
  });
}

export function fetchPendingWithdrawals(
  opts: { signal?: AbortSignal } = {},
): Promise<PendingWithdrawalsResponse> {
  return apiClient(
    `/api/admin/withdrawals`,
    PendingWithdrawalsResponseSchema,
    { signal: opts.signal },
  );
}

export function confirmWithdrawal(
  id: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiClient(`/api/admin/withdrawals/${id}/confirm`, MessageResponseSchema, {
    method: 'POST',
    signal: opts.signal,
  });
}

export function rejectWithdrawal(
  id: string,
  comment: string,
  opts: { signal?: AbortSignal } = {},
) {
  const body = WithdrawalDecisionRequestSchema.parse({ comment });
  return apiClient(`/api/admin/withdrawals/${id}/reject`, MessageResponseSchema, {
    method: 'POST',
    body,
    signal: opts.signal,
  });
}

const BalanceSchema = z.object({
  user: z.string(),
  avatar: z.string(),
  balance: z.number(),
  status: z.string(),
  lastActivity: z.string(),
});
export type Balance = z.infer<typeof BalanceSchema>;

export function fetchBalances(
  opts: { signal?: AbortSignal } = {},
): Promise<Balance[]> {
  return apiClient(`/api/admin/balances`, z.array(BalanceSchema), {
    signal: opts.signal,
  });
}

const TransactionLogEntrySchema = z.object({
  datetime: z.string(),
  action: z.string(),
  amount: z.number().int(),
  by: z.string(),
  notes: z.string(),
  status: z.string(),
});
export type TransactionLogEntry = z.infer<typeof TransactionLogEntrySchema>;

export function fetchTransactionsLog(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionLogEntry[]> {
  return apiClient(`/api/admin/transactions`, z.array(TransactionLogEntrySchema), {
    signal: opts.signal,
  });
}

export function fetchIban(
  opts: { signal?: AbortSignal } = {},
): Promise<IbanResponse> {
  return apiClient(`/api/wallet/iban`, IbanResponseSchema, { signal: opts.signal });
}

export function fetchIbanHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<IbanHistoryResponse> {
  return apiClient(
    `/api/wallet/iban/history`,
    IbanHistoryResponseSchema,
    { signal: opts.signal },
  );
}
