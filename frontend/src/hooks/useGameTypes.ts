'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { GameTypeListSchema, type GameType } from '@/types/game-type';

export function useGameTypes() {
  return useQuery<GameType[]>({
    queryKey: ['game-types'],
    queryFn: ({ signal }) =>
      apiClient('/api/game-types', GameTypeListSchema, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
