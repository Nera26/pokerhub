import dynamic from 'next/dynamic';

const LeaderboardPage = dynamic(() => import('@/features/site/leaderboard'), {
  loading: () => <div>Loading...</div>,
});

export default LeaderboardPage;
