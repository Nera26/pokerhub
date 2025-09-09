'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '@/lib/api/profile';
import type { ProfileStatsResponse } from '@shared/types';

type HistoryTab = 'game-history' | 'tournament-history' | 'transaction-history';

interface Props {
  onSelectTab(tab: HistoryTab): void;
}

function useProfileStats() {
  return useQuery<ProfileStatsResponse>({
    queryKey: ['profileStats'],
    queryFn: ({ signal }) => fetchStats({ signal }),
  });
}

export default function GameStatistics({ onSelectTab }: Props) {
  const { data: stats, isLoading, isError } = useProfileStats();

  if (isLoading) {
    return <p>Loading stats...</p>;
  }

  if (isError || !stats) {
    return <p>Error loading stats</p>;
  }

  const cards: { value: string; label: string; tab: HistoryTab }[] = [
    {
      value: stats.handsPlayed.toLocaleString(),
      label: 'Hands Played',
      tab: 'game-history',
    },
    {
      value: `${stats.winRate}%`,
      label: 'Win Rate',
      tab: 'game-history',
    },
    {
      value: stats.tournamentsPlayed.toLocaleString(),
      label: 'Tournaments Played',
      tab: 'tournament-history',
    },
    {
      value: `${stats.topThreeRate}%`,
      label: 'Top 3 Placement',
      tab: 'tournament-history',
    },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Game Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-card-bg rounded-2xl p-8 text-center cursor-pointer hover:bg-hover-bg hover:scale-105 transition-transform duration-200"
            onClick={() => onSelectTab(c.tab)}
          >
            <p className="text-3xl font-bold text-accent-yellow">{c.value}</p>
            <p className="text-text-secondary mt-1 text-sm">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
