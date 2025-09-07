'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchTables,
  fetchTournaments,
  fetchCTAs,
  type Table,
  type Tournament,
  type CTA,
} from '@/lib/api/lobby';

export type { Table, Tournament, CTA } from '@/lib/api/lobby';

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

export function useCTAs() {
  return useQuery<CTA[]>({
    queryKey: ['ctas'],
    queryFn: ({ signal }) => fetchCTAs({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
