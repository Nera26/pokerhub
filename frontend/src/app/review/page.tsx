import dynamic from 'next/dynamic';

const ReviewPage = dynamic(() => import('@/features/collusion'), {
  loading: () => <div>Loading...</div>,
});

export default ReviewPage;
