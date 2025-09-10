'use client';

import { createQueryHook } from './useApiQuery';
import { fetchChipDenominations } from '@/lib/api/config';
import type { ChipDenominationsResponse } from '@shared/types';

export const useChipDenominations = createQueryHook<ChipDenominationsResponse>(
  'chip-denoms',
  (_client, opts) => fetchChipDenominations({ signal: opts.signal }),
  'chip denominations',
);
