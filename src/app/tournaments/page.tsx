import dynamic from 'next/dynamic';

const TournamentPage = dynamic(() => import('@/features/tournament'), {
  loading: () => <div>Loading...</div>,
});

export default TournamentPage;
