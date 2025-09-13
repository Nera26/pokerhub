'use client';

import { fetchPromotions } from '@/lib/api/promotions';
import type { Promotion } from '@shared/types';
import { createQueryHook } from './createQueryHook';

export const usePromotions = createQueryHook<Promotion[]>(
  'promotions',
  (_client, _params, opts) => fetchPromotions({ signal: opts.signal }),
  'promotions',
  { staleTime: 60_000, refetchOnWindowFocus: false },
);
