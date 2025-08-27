import dynamic from 'next/dynamic';

const WalletPage = dynamic(() => import('@/features/site/wallet'), {
  loading: () => <div>Loading...</div>,
});

export default WalletPage;
