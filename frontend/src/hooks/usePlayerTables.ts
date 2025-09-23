'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPlayerTables, type PlayerTableSession } from '@/lib/api/table';

export function usePlayerTables() {
  return useQuery<PlayerTableSession[]>({
    queryKey: ['playerTables'],
    queryFn: ({ signal }) => fetchPlayerTables({ signal }),
  });
}
