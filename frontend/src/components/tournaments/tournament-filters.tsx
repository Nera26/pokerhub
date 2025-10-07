'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTournamentFilters } from '@/lib/api/lobby';
import type { TournamentFilter, TournamentFilterOption } from '@shared/types';

export type { TournamentFilter } from '@shared/types';

export interface TournamentFiltersProps {
  /** Currently selected filter */
  selected: TournamentFilter;
  /** Called when a filter is clicked */
  onChange: (filter: TournamentFilter) => void;
}

export default function TournamentFilters({
  selected,
  onChange,
}: TournamentFiltersProps) {
  const { data, isLoading, error } = useQuery<TournamentFilterOption[], Error>({
    queryKey: ['tournament-filters'],
    queryFn: ({ signal }) => fetchTournamentFilters({ signal }),
  });

  if (error) throw error;
  const options = data ?? [];

  return (
    <div className="flex space-x-4 mb-6">
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-3 rounded-xl bg-card-bg h-12 w-24 animate-pulse"
            />
          ))
        : options.map(({ label, value }) => {
            const isActive = value === selected;
            const base =
              'px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200';
            const activeClasses = 'bg-accent-yellow text-text-primary';
            const inactiveClasses =
              'bg-card-bg text-text-secondary hover:bg-hover-bg hover:text-accent-yellow';
            return (
              <button
                key={value}
                type="button"
                className={`${base} ${isActive ? activeClasses : inactiveClasses}`}
                onClick={() => onChange(value)}
              >
                {label}
              </button>
            );
          })}
    </div>
  );
}
