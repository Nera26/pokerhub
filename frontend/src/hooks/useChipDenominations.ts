'use client';

import { createQueryHook } from './createQueryHook';
import {
  ChipDenominationsResponseSchema,
  type ChipDenominationsResponse,
} from '@shared/types';

export const useChipDenominations = createQueryHook<ChipDenominationsResponse>(
  'chip-denoms',
  (client, opts) =>
    client('/api/config/chips', ChipDenominationsResponseSchema, opts),
  'chip denominations',
);
