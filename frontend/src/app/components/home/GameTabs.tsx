'use client';
import type { GameType } from '@shared/types';
import InlineError from '../ui/InlineError';
import { useGameTypes } from '@/hooks/useGameTypes';
import { useApiError } from '@/hooks/useApiError';

interface GameTabsProps {
  gameType: GameType;
  setGameType: (id: GameType) => void;
}

export default function GameTabs({ gameType, setGameType }: GameTabsProps) {
  const { data, isLoading, error } = useGameTypes();
  const errorMessage = useApiError(error);

  if (isLoading) {
    return (
      <section className="mb-6 md:mb-8">
        <p className="text-center" role="status">
          Loading game types...
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mb-6 md:mb-8">
        <InlineError message={errorMessage} />
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section className="mb-6 md:mb-8">
        <p className="text-center text-text-secondary">No games available</p>
      </section>
    );
  }

  const tabs = data;

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
