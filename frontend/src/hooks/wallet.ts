'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryHook } from './createQueryHook';
import {
  fetchIban,
  fetchIbanHistory,
  fetchWalletReconcileMismatches,
  getStatus,
  updateIban,
  initiateBankTransfer,
  withdraw,
} from '@/lib/api/wallet';
import { useAuth } from '@/context/AuthContext';
import type {
  IbanResponse,
  IbanHistoryResponse,
  WalletReconcileMismatchesResponse,
  IbanUpdateRequest,
  WalletStatusResponse,
  BankTransferDepositResponse,
} from '@shared/wallet.schema';

export function useWalletStatus() {
  const { playerId } = useAuth();
  return useQuery<WalletStatusResponse>({
    queryKey: ['wallet', playerId, 'status'],
    queryFn: ({ signal }) => getStatus(playerId, { signal }),
  });
}

export const useIban = createQueryHook<IbanResponse>(
  'iban',
  (_client, opts) => fetchIban(opts),
  'IBAN',
);

export const useIbanHistory = createQueryHook<IbanHistoryResponse>(
  'iban-history',
  (_client, opts) => fetchIbanHistory(opts),
  'IBAN history',
);

export const useWalletReconcileMismatches =
  createQueryHook<WalletReconcileMismatchesResponse>(
    'wallet-reconcile-mismatches',
    (_client, opts) => fetchWalletReconcileMismatches(opts),
    'wallet reconcile mismatches',
  );

export function useUpdateIban() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IbanUpdateRequest) => updateIban(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iban'] });
      queryClient.invalidateQueries({ queryKey: ['iban-history'] });
    },
  });
}

export function useBankTransfer() {
  const { playerId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    BankTransferDepositResponse,
    Error,
    { amount: number; deviceId: string; currency: string }
  >({
    mutationFn: ({ amount, deviceId, currency }) =>
      initiateBankTransfer(playerId, amount, deviceId, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', playerId, 'status'] });
    },
  });
}

export function useWithdraw() {
  const { playerId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<
    WalletStatusResponse,
    Error,
    { amount: number; deviceId: string; currency: string }
  >({
    mutationFn: ({ amount, deviceId, currency }) =>
      withdraw(playerId, amount, deviceId, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', playerId, 'status'] });
    },
  });
}
