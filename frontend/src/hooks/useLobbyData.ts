'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchTables,
  fetchTournaments,
  type Table,
  type Tournament,
} from '@/lib/api/lobby';

export type { Table, Tournament } from '@/lib/api/lobby';

export function useTables() {
  return useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: ({ signal }) => fetchTables({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useTournaments() {
  return useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: ({ signal }) => fetchTournaments({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
