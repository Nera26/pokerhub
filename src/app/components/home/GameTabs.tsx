'use client';

import React from 'react';
import { GameType } from '@/types/game-type';

interface GameTabsProps {
  gameType: GameType;
  setGameType: (id: GameType) => void;
}

const tabs: { id: GameType; label: string }[] = [
  { id: 'texas', label: "Texas Hold'em" },
  { id: 'omaha', label: 'Omaha' },
  { id: 'allin', label: 'All-in or Fold' },
  { id: 'tournaments', label: 'Tournaments' },
];

export default function GameTabs({ gameType, setGameType }: GameTabsProps) {
  return (
    <section className="mb-6 md:mb-8">
      <nav
        aria-label="Game type tabs"
        className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={gameType === tab.id}
            aria-controls={
              tab.id === 'tournaments'
                ? 'tournaments-panel'
                : 'cash-games-panel'
            }
            onClick={() => setGameType(tab.id)}
            className={`whitespace-nowrap px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold ${
              gameType === tab.id
                ? 'bg-accent-yellow text-primary-bg hover-glow-yellow'
                : 'bg-card-bg text-text-secondary hover:bg-hover-bg hover:text-accent-yellow transition-colors duration-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
