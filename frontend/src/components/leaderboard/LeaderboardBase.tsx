'use client';

import LeaderboardTable from './LeaderboardTable';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import type { LeaderboardEntry } from '@shared/types';

interface LeaderboardBaseProps {
  onPlayerClick?: (player: LeaderboardEntry) => void;
}

export default function LeaderboardBase({ onPlayerClick }: LeaderboardBaseProps) {
  const { data, isLoading, error } = useLeaderboard();
  const players = data ?? [];

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Failed to load leaderboard</p>;
  }

  return <LeaderboardTable data={players} onPlayerClick={onPlayerClick} />;
}

