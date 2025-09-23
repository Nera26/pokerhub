'use client';

import { fetchChipDenominations } from '@/lib/api/config';
import { createQueryHook } from './createQueryHook';
import type { ChipDenominationsResponse } from '@shared/types';

export const useChipDenominations = createQueryHook<ChipDenominationsResponse>(
  'chip-denominations',
  (_client, opts) => fetchChipDenominations(opts),
  'chip denominations',
);
