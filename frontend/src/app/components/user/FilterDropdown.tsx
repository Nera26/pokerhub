// components/common/FilterDropdown.tsx
'use client';
import React, { useState, useEffect, memo } from 'react';
import type { GameFilter, ProfitLossFilter } from '@/types/filters';

interface FilterDropdownProps {
  open: boolean;
  filters: { gameType: GameFilter; profitLoss: ProfitLossFilter; date: string };
  onApply(filters: {
    gameType: GameFilter;
    profitLoss: ProfitLossFilter;
    date: string;
  }): void;
  onReset(): void;
  /** accept extra class for positioning */
  className?: string;
}

function FilterDropdown({
  open,
  filters,
  onApply,
  onReset,
  className = '',
}: FilterDropdownProps) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  if (!open) return null;

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
            onChange={(e) =>
              setLocal({ ...local, gameType: e.target.value as GameFilter })
            }
          >
            <option value="any">Any</option>
            <option>Texas Hold'em</option>
            <option>Omaha</option>
          </select>
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
            onClick={onReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="bg-accent-green text-white font-semibold py-1 px-3 rounded-xl hover-glow-green"
            onClick={() => onApply(local)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(FilterDropdown);
