// components/common/FilterDropdown.tsx
'use client';
import { useState, useEffect } from 'react';
import { useGameTypes } from '@/hooks/useGameTypes';
import type { GameFilter, ProfitLossFilter } from '@/types/filters';

interface FilterDropdownProps {
  filters: { gameType: GameFilter; profitLoss: ProfitLossFilter; date: string };
  onChange(filters: {
    gameType: GameFilter;
    profitLoss: ProfitLossFilter;
    date: string;
  }): void;
  /** accept extra class for positioning */
  className?: string;
}

function FilterDropdown({
  filters,
  onChange,
  className = '',
}: FilterDropdownProps) {
  const [local, setLocal] = useState(filters);
  const {
    data: gameTypes = [],
    isLoading: gameTypesLoading,
    error: gameTypesError,
  } = useGameTypes();

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const handleReset = () => {
    const resetFilters: FilterDropdownProps['filters'] = {
      gameType: 'any',
      profitLoss: 'any',
      date: '',
    };
    setLocal(resetFilters);
    onChange(resetFilters);
  };

  return (
    <div
      className={`${className} bg-card-bg border border-border-dark rounded-2xl p-4 w-60 z-10`}
    >
      <h4 className="font-semibold mb-2 text-text-primary">Filter Games</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-text-secondary mb-1">Game Type</label>
          <select
            className="w-full p-2 bg-primary-bg border border-border-dark rounded"
            value={local.gameType}
            disabled={gameTypesLoading}
            onChange={(e) =>
              setLocal({ ...local, gameType: e.target.value as GameFilter })
            }
          >
            <option value="any">Any</option>
            {gameTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          {gameTypesError && (
            <p className="mt-1 text-danger-red" role="alert">
              Failed to load game types
            </p>
          )}
        </div>
        <div>
          <label className="block text-text-secondary mb-1">
            Profit / Loss
          </label>
          <select
            className="w-full p-2 bg-primary-bg border border-border-dark rounded"
            value={local.profitLoss}
            onChange={(e) =>
              setLocal({
                ...local,
                profitLoss: e.target.value as ProfitLossFilter,
              })
            }
          >
            <option value="any">Any</option>
            <option value="win">Profit</option>
            <option value="loss">Loss</option>
          </select>
        </div>
        <div>
          <label className="block text-text-secondary mb-1">Date</label>
          <input
            type="date"
            className="w-full p-2 bg-primary-bg border border-border-dark rounded"
            value={local.date}
            onChange={(e) => setLocal({ ...local, date: e.target.value })}
          />
        </div>
        <div className="flex justify-end space-x-2 mt-2">
          <button
            type="button"
            className="text-text-secondary hover:text-accent-yellow"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="bg-accent-green text-white font-semibold py-1 px-3 rounded-xl hover-glow-green"
            onClick={() => onChange(local)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterDropdown;
