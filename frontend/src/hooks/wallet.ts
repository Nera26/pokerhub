'use client';

import { createQueryHook } from './useApiQuery';
import { fetchIban, fetchIbanHistory } from '@/lib/api/wallet';
import type { IbanResponse, IbanHistoryResponse } from '@shared/wallet.schema';

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
