'use client';

import { createQueryHook } from './useApiQuery';
import { fetchIban } from '@/lib/api/wallet';
import type { IbanResponse } from '@shared/wallet.schema';

export const useIban = createQueryHook<IbanResponse>(
  'iban',
  fetchIban,
  'IBAN',
);

