'use client';

import { createGetHook } from './useApiQuery';
import {
  BlockedCountriesResponseSchema,
  type BlockedCountriesResponse,
} from '@shared/types';

export const useBlockedCountries = createGetHook<BlockedCountriesResponse>(
  '/api/admin/blocked-countries',
  BlockedCountriesResponseSchema,
);
