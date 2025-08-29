import dynamic from 'next/dynamic';

const VerifyPage = dynamic(() => import('@/features/table/verify'), {
  loading: () => <div>Loading...</div>,
});

export default VerifyPage;
