'use client';

import { createQueryHook } from './useApiQuery';
import { fetchIbanHistory } from '@/lib/api/wallet';
import type { IbanHistoryResponse } from '@shared/wallet.schema';

export const useIbanHistory = createQueryHook<IbanHistoryResponse>(
  'iban-history',
  fetchIbanHistory,
  'IBAN history',
);

