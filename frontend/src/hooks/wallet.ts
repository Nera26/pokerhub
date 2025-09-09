'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQueryHook } from './useApiQuery';
import {
  fetchIban,
  fetchIbanHistory,
  fetchWalletReconcileMismatches,
  updateIban,
} from '@/lib/api/wallet';
import type {
  IbanResponse,
  IbanHistoryResponse,
  WalletReconcileMismatchesResponse,
  IbanUpdateRequest,
} from '@shared/wallet.schema';

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
