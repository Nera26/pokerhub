'use client';

import { fetchActivity } from '@/lib/api/analytics';
import type { ActivityResponse } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useActivity = createQueryHook<ActivityResponse>(
  'activity',
  (_client, _params, opts) => fetchActivity({ signal: opts.signal }),
  'activity',
);
