'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGameTypes } from '@/lib/api/game-types';
import type { GameTypeList } from '@shared/types';

export function useGameTypes() {
  return useQuery<GameTypeList>({
    queryKey: ['game-types'],
    queryFn: ({ signal }) => fetchGameTypes({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
