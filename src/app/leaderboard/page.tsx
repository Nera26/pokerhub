import dynamic from 'next/dynamic';

const LeaderboardPage = dynamic(() => import('@/features/leaderboard'), {
  loading: () => <div>Loading...</div>,
});

export default LeaderboardPage;
