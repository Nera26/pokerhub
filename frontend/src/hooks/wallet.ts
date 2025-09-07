'use client';

import { createQueryHook } from './useApiQuery';
import { fetchIban, fetchIbanHistory } from '@/lib/api/wallet';
import type { IbanResponse, IbanHistoryResponse } from '@shared/wallet.schema';

export const useIban = createQueryHook<IbanResponse>(
  'iban',
  fetchIban,
  'IBAN',
);

export const useIbanHistory = createQueryHook<IbanHistoryResponse>(
  'iban-history',
  fetchIbanHistory,
  'IBAN history',
);
