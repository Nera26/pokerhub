/* istanbul ignore file */
import { z } from 'zod';
import { apiClient } from './client';
import {
  AmountSchema,
  WithdrawSchema,
  DepositSchema,
  BankTransferDepositRequestSchema,
  BankTransferDepositResponseSchema,
  WalletStatusResponseSchema,
  WalletTransactionsResponseSchema,
  PendingTransactionsResponseSchema,
  PendingDepositsResponseSchema,
  DepositDecisionRequestSchema,
  IbanResponseSchema,
  IbanHistoryResponseSchema,
  WalletReconcileMismatchesResponseSchema,
  type WalletStatusResponse,
  type WalletTransactionsResponse,
  type PendingTransactionsResponse,
  type PendingDepositsResponse,
  type IbanResponse,
  type IbanHistoryResponse,
  type WalletReconcileMismatchesResponse,
  TransactionTabsResponseSchema,
  type TransactionTab,
} from '@shared/wallet.schema';
import {
  MessageResponseSchema,
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
  TransactionTypeSchema,
  type TransactionType,
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
  const payload = WithdrawSchema.parse({ amount, deviceId, currency });
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
  const payload = DepositSchema.parse({ amount, deviceId, currency });
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

export function fetchWalletReconcileMismatches(
  opts: { signal?: AbortSignal } = {},
): Promise<WalletReconcileMismatchesResponse> {
  return apiClient(
    `/api/admin/wallet/reconcile/mismatches`,
    WalletReconcileMismatchesResponseSchema,
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

const AdminPlayerSchema = z.object({
  id: z.string(),
  username: z.string(),
});
export type AdminPlayer = z.infer<typeof AdminPlayerSchema>;

export function fetchAdminPlayers(
  opts: { signal?: AbortSignal } = {},
): Promise<AdminPlayer[]> {
  return apiClient(`/api/admin/players`, z.array(AdminPlayerSchema), {
    signal: opts.signal,
  });
}

export async function fetchTransactionTabs(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionTab[]> {
  return apiClient(
    `/api/admin/transactions/tabs`,
    TransactionTabsResponseSchema,
    { signal: opts.signal },
  );
}

export async function fetchTransactionTypes(
  opts: { signal?: AbortSignal } = {},
): Promise<TransactionType[]> {
  try {
    return await apiClient(
      `/api/transactions/types`,
      z.array(TransactionTypeSchema),
      { signal: opts.signal },
    );
  } catch (err) {
    console.error('fetchTransactionTypes failed', err);
    throw err;
  }
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

export async function fetchTransactionsLog(
  opts: {
    signal?: AbortSignal;
    playerId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<TransactionLogEntry[]> {
  const params = new URLSearchParams();
  if (opts.playerId) params.set('playerId', opts.playerId);
  if (opts.type) params.set('type', opts.type);
  if (opts.startDate) params.set('startDate', opts.startDate);
  if (opts.endDate) params.set('endDate', opts.endDate);
  const query = params.toString();
  try {
    return await apiClient(
      `/api/admin/transactions${query ? `?${query}` : ''}`,
      z.array(TransactionLogEntrySchema),
      { signal: opts.signal },
    );
  } catch (err) {
    console.error('fetchTransactionsLog failed', err);
    throw err;
  }
}

const BankAccountSchema = z.object({
  accountNumber: z.string(),
  tier: z.string(),
  holder: z.string(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

export function fetchBankAccount(
  playerId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<BankAccount> {
  return apiClient(
    `/api/wallet/${playerId}/bank-account`,
    BankAccountSchema,
    { signal: opts.signal },
  );
}

/**
 * Fetch the current deposit IBAN along with last update metadata.
 */
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
