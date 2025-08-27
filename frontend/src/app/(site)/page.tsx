import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('@/features/site/home'), {
  loading: () => <div>Loading...</div>,
});

export default HomePage;
