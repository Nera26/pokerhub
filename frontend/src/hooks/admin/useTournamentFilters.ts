import { useQuery } from '@tanstack/react-query';
import { fetchAdminTournamentFilters } from '@/lib/api/admin';
import type { AdminTournamentFiltersResponse } from '@shared/types';

const QUERY_KEY = ['admin', 'tournaments', 'filters'] as const;

export function useAdminTournamentFilters({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<AdminTournamentFiltersResponse>({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchAdminTournamentFilters({ signal }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export type UseAdminTournamentFiltersReturn = ReturnType<
  typeof useAdminTournamentFilters
>;
