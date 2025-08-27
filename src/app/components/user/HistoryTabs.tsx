// components/user/HistoryTabs.tsx
'use client';
import React from 'react';

interface Props {
  selected: 'game-history' | 'tournament-history' | 'transaction-history';
  onChange(tab: string): void;
}

export default function HistoryTabs({ selected, onChange }: Props) {
  const tabs = [
    { label: 'Game History',       key: 'game-history' },
    { label: 'Tournament History', key: 'tournament-history' },
    { label: 'Deposit/Withdraw',   key: 'transaction-history' },
  ];

  return (
    <div className="overflow-x-auto border-b border-border-dark mb-6">
      <ul className="flex space-x-8 whitespace-nowrap px-4 lg:px-0">
        {tabs.map(t => (
          <li key={t.key}>
            <button
              onClick={() => onChange(t.key)}
              className={`
                pb-2 font-semibold cursor-pointer focus:outline-none
                ${selected === t.key
                  ? 'border-b-2 border-accent-yellow text-accent-yellow'
                  : 'text-text-secondary hover:text-accent-yellow transition-colors duration-150'}
              `}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
