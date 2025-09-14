'use client';

import { fetchBotProfiles } from '@/lib/api/lobby';
import type { BotProfile } from '@shared/types';
import { createQueryHook } from './createQueryHook';

export const useBotProfiles = createQueryHook<BotProfile[]>(
  'bot-profiles',
  (_client, _params, opts) => fetchBotProfiles({ signal: opts.signal }),
  'bot profiles',
  { staleTime: 60_000, refetchOnWindowFocus: false },
);
