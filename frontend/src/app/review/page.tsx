import dynamic from 'next/dynamic';

const ReviewPage = dynamic(() => import('@/features/review'), {
  loading: () => <div>Loading...</div>,
});

export default ReviewPage;
