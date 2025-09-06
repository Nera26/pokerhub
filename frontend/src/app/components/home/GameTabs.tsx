'use client';
import { GameType } from '@/types/game-type';
import { useGameTypes } from '@/hooks/useGameTypes';
import { useApiError } from '@/hooks/useApiError';
import InlineError from '../ui/InlineError';

interface GameTabsProps {
  gameType: GameType;
  setGameType: (id: GameType) => void;
}

const LABELS: Record<GameType, string> = {
  texas: "Texas Hold'em",
  omaha: 'Omaha',
  allin: 'All-in or Fold',
  tournaments: 'Tournaments',
};

export default function GameTabs({ gameType, setGameType }: GameTabsProps) {
  const { data, error, isLoading } = useGameTypes();
  const errorMessage = useApiError(error);

  if (isLoading) {
    return (
      <section className="mb-6 md:mb-8">
        <div className="h-12 w-full rounded-2xl bg-card-bg animate-pulse" />
      </section>
    );
  }

  if (errorMessage) {
    return <InlineError message={errorMessage} />;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 md:mb-8">
      <nav
        aria-label="Game type tabs"
        className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2"
        role="tablist"
      >
        {data.map((id) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={gameType === id}
            aria-controls={
              id === 'tournaments' ? 'tournaments-panel' : 'cash-games-panel'
            }
            onClick={() => setGameType(id)}
            className={`whitespace-nowrap px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold ${
              gameType === id
                ? 'bg-accent-yellow text-primary-bg hover-glow-yellow'
                : 'bg-card-bg text-text-secondary hover:bg-hover-bg hover:text-accent-yellow transition-colors duration-200'
            }`}
          >
            {LABELS[id]}
          </button>
        ))}
      </nav>
    </section>
  );
}
