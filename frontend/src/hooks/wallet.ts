'use client';

import { createQueryHook } from './useApiQuery';
import {
  fetchIban,
  fetchIbanHistory,
  fetchWalletReconcileMismatches,
} from '@/lib/api/wallet';
import type {
  IbanResponse,
  IbanHistoryResponse,
  WalletReconcileMismatchesResponse,
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
