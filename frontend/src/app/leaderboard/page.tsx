import dynamic from 'next/dynamic';

const LeaderboardPage = dynamic(
  () => import('@/features/leaderboard').then((m) => m.LeaderboardBase),
  {
    loading: () => <div>Loading...</div>,
  },
);

export default LeaderboardPage;
