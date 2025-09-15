import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardEntry, TimeFilter } from '@shared/types';

export function useLeaderboard(range: TimeFilter) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', range],
    queryFn: ({ signal }) => fetchLeaderboard({ signal, range }),
  });
}
