'use client';

import { useState } from 'react';
import LeaderboardTable from './LeaderboardTable';
import LeaderboardTabs from './LeaderboardTabs';
import { useLeaderboard } from './useLeaderboard';
import type { LeaderboardEntry, TimeFilter } from '@shared/types';

interface LeaderboardBaseProps {
  onPlayerClick?: (player: LeaderboardEntry) => void;
}

export default function LeaderboardBase({
  onPlayerClick,
}: LeaderboardBaseProps) {
  const [range, setRange] = useState<TimeFilter>('daily');
  const { data, isLoading, error } = useLeaderboard(range);
  const players = data ?? [];

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Failed to load leaderboard</p>;
  }

  return (
    <>
      <LeaderboardTabs selected={range} onChange={setRange} />
      <LeaderboardTable data={players} onPlayerClick={onPlayerClick} />
    </>
  );
}
