'use client';


export type TournamentFilter = 'active' | 'upcoming' | 'past';

export interface TournamentFiltersProps {
  /** Currently selected filter */
  selected: TournamentFilter;
  /** Called when a filter is clicked */
  onChange: (filter: TournamentFilter) => void;
}

const options: { label: string; value: TournamentFilter }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

export default function TournamentFilters({ selected, onChange }: TournamentFiltersProps) {
  return (
    <div className="flex space-x-4 mb-6">
      {options.map(({ label, value }) => {
        const isActive = value === selected;
        const base = 'px-6 py-3 rounded-xl font-semibold text-sm transition-colors duration-200';
        const activeClasses = 'bg-accent-yellow text-text-primary';
        const inactiveClasses = 'bg-card-bg text-text-secondary hover:bg-hover-bg hover:text-accent-yellow';
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
