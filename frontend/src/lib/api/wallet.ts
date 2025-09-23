/* istanbul ignore file */
import { z } from 'zod';
import { apiClient } from './client';
import {
  WithdrawSchema,
  DepositSchema,
  BankTransferDepositRequestSchema,
  BankTransferDepositResponseSchema,
  WalletStatusResponseSchema,
  DepositDecisionRequestSchema,
  IbanResponseSchema,
  IbanHistoryResponseSchema,
  IbanUpdateRequestSchema,
  IbanDetailsSchema,
  WalletReconcileMismatchesResponseSchema,
  WalletReconcileMismatchAcknowledgementSchema,
  BankReconciliationRequestSchema,
  WithdrawalDecisionRequestSchema,
  type BankReconciliationEntry,
  type WalletStatusResponse,
  type IbanResponse,
  type IbanHistoryResponse,
  type IbanUpdateRequest,
  type IbanDetails,
  type WalletReconcileMismatchesResponse,
  type WalletReconcileMismatchAcknowledgement,
  // Optionally validate before calling adminAdjustBalance
  AdminBalanceRequestSchema,
  type AdminBalanceRequest,
} from '@shared/wallet.schema';
import {
  MessageResponseSchema,
  type MessageResponse,
  AdminPlayerSchema,
  type AdminPlayer,
} from '@shared/types';

export type { IbanDetails };

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
  return apiClient(
    `/api/wallet/${playerId}/status`,
    WalletStatusResponseSchema,
    {
      signal: opts.signal,
    },
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

export function markWalletMismatchAcknowledged(
  account: string,
  opts: { signal?: AbortSignal } = {},
): Promise<WalletReconcileMismatchAcknowledgement> {
  return apiClient(
    `/api/admin/wallet/reconcile/mismatches/${encodeURIComponent(account)}/ack`,
    WalletReconcileMismatchAcknowledgementSchema,
    {
      method: 'POST',
      signal: opts.signal,
    },
  );
}

type ReconcileDepositsPayload =
  | { file: File; entries?: never }
  | { entries: BankReconciliationEntry[]; file?: never };

export function reconcileDeposits(
  payload: ReconcileDepositsPayload,
  opts: { signal?: AbortSignal } = {},
): Promise<MessageResponse> {
  if ('file' in payload && payload.file) {
    const form = new FormData();
    form.append('file', payload.file);
    return apiClient('/api/admin/deposits/reconcile', MessageResponseSchema, {
      method: 'POST',
      body: form,
      signal: opts.signal,
    });
  }

  const body = BankReconciliationRequestSchema.parse({
    entries: payload.entries,
  });
  return apiClient('/api/admin/deposits/reconcile', MessageResponseSchema, {
    method: 'POST',
    body,
    signal: opts.signal,
  });
}

export function confirmDeposit(
  id: string,
  opts: { signal?: AbortSignal } = {},
) {
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

export function confirmWithdrawal(
  id: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiClient(
    `/api/admin/withdrawals/${id}/confirm`,
    MessageResponseSchema,
    {
      method: 'POST',
      signal: opts.signal,
    },
  );
}

export function rejectWithdrawal(
  id: string,
  comment: string,
  opts: { signal?: AbortSignal } = {},
) {
  const body = WithdrawalDecisionRequestSchema.parse({ comment });
  return apiClient(
    `/api/admin/withdrawals/${id}/reject`,
    MessageResponseSchema,
    {
      method: 'POST',
      body,
      signal: opts.signal,
    },
  );
}

export function adminAdjustBalance(
  userId: string,
  body: AdminBalanceRequest,
): Promise<MessageResponse> {
  // Optionally validate:
  // AdminBalanceRequestSchema.parse(body);
  return apiClient(`/api/admin/balance/${userId}`, MessageResponseSchema, {
    method: 'POST',
    body,
  });
}

export function fetchAdminPlayers(
  opts: { signal?: AbortSignal; limit?: number } = {},
): Promise<AdminPlayer[]> {
  const query =
    typeof opts.limit === 'number'
      ? `?limit=${encodeURIComponent(opts.limit)}`
      : '';
  return apiClient(
    `/api/admin/users/players${query}`,
    z.array(AdminPlayerSchema),
    {
      signal: opts.signal,
    },
  );
}

export function fetchIbanDetails(
  opts: { signal?: AbortSignal } = {},
): Promise<IbanDetails> {
  return apiClient(`/api/wallet/iban`, IbanDetailsSchema, {
    signal: opts.signal,
  });
}

/**
 * Fetch the current deposit IBAN along with last update metadata.
 */
export function fetchIban(
  opts: { signal?: AbortSignal } = {},
): Promise<IbanResponse> {
  return apiClient(`/api/wallet/iban`, IbanResponseSchema, {
    signal: opts.signal,
  });
}

export function fetchIbanHistory(
  opts: { signal?: AbortSignal } = {},
): Promise<IbanHistoryResponse> {
  return apiClient(`/api/wallet/iban/history`, IbanHistoryResponseSchema, {
    signal: opts.signal,
  });
}

export function updateIban(
  data: IbanUpdateRequest,
  opts: { signal?: AbortSignal } = {},
): Promise<IbanResponse> {
  const body = IbanUpdateRequestSchema.parse(data);
  return apiClient(`/api/wallet/iban`, IbanResponseSchema, {
    method: 'POST',
    body,
    signal: opts.signal,
  });
}
