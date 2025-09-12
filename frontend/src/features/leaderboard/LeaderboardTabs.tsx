'use client';

import { useRef, type KeyboardEvent } from 'react';
import { useLeaderboardRanges } from '@/lib/api/leaderboard';
import type { TimeFilter } from '@shared/types';

export interface LeaderboardTabsProps {
  /** Currently selected time filter */
  selected: TimeFilter;
  /** Called when user selects a different filter */
  onChange: (filter: TimeFilter) => void;
}

export default function LeaderboardTabs({
  selected,
  onChange,
}: LeaderboardTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { data, isLoading, error } = useLeaderboardRanges();
  const options = data?.ranges ?? [];

  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + direction + options.length) % options.length;
        const nextValue = options[nextIndex];
        onChange(nextValue);
        tabRefs.current[nextIndex]?.focus();
      }
    };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading ranges</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Time Period:
      </label>
      <div className="flex space-x-2" role="tablist">
        {options.map((value, index) => {
          const isActive = value === selected;
          const label = value.charAt(0).toUpperCase() + value.slice(1);
          const base =
            'px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 hover-glow-yellow';
          const activeStyles = 'bg-accent-yellow text-primary-bg';
          const inactiveStyles =
            'bg-hover-bg text-text-secondary hover:bg-accent-yellow hover:text-primary-bg';

          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${base} ${isActive ? activeStyles : inactiveStyles}`}
              onClick={() => onChange(value)}
              onKeyDown={handleKeyDown(index)}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
