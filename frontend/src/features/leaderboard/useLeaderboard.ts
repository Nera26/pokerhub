import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardEntry } from '@shared/types';

export function useLeaderboard() {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: ({ signal }) => fetchLeaderboard({ signal }),
  });
}
