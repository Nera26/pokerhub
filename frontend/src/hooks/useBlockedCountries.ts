'use client';

import { createQueryHook } from './createQueryHook';
import { fetchBlockedCountries } from '@/lib/api/blockedCountries';
import type { BlockedCountriesResponse } from '@shared/types';

export const useBlockedCountries = createQueryHook<BlockedCountriesResponse>(
  'admin-blocked-countries',
  (_client, _params, opts) => fetchBlockedCountries(opts),
  'blocked countries',
);
