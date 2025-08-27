import dynamic from 'next/dynamic';

const PromotionsPage = dynamic(() => import('@/features/site/promotions'), {
  loading: () => <div>Loading...</div>,
});

export default PromotionsPage;
