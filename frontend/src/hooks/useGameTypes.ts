'use client';

import { fetchGameTypes } from '@/lib/api/game-types';
import type { GameTypeList } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useGameTypes = createQueryHook<GameTypeList>(
  'game-types',
  (_client, _params, opts) => fetchGameTypes({ signal: opts.signal }),
  'game types',
  { staleTime: 60_000, refetchOnWindowFocus: false },
);
