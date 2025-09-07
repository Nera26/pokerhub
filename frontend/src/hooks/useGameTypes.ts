'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchGameTypes } from '@/lib/api/game-types';
import type { GameType } from '@shared/types';

export function useGameTypes() {
  return useQuery<GameType[]>({
    queryKey: ['game-types'],
    queryFn: ({ signal }) => fetchGameTypes({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
