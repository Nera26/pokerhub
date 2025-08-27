import dynamic from 'next/dynamic';

const DashboardPage = dynamic(() => import('@/features/dashboard'), {
  loading: () => <div>Loading...</div>,
});

export default DashboardPage;
