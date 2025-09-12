'use client';

import WalletSummary from '../components/wallet/WalletSummary';
import { useWalletStatus } from '@/hooks/wallet';

export default function WalletPage() {
  const { data, isLoading, error } = useWalletStatus();

  if (isLoading) {
    return <div>Loading wallet...</div>;
  }

  if (error) {
    return <div role="alert">Failed to load wallet</div>;
  }

  if (!data) {
    return <div>No wallet data available</div>;
  }

  return (
    <WalletSummary
      realBalance={data.realBalance}
      creditBalance={data.creditBalance}
      kycVerified={data.kycVerified}
      currency={data.currency}
      onDeposit={() => {}}
      onWithdraw={() => {}}
      onVerify={() => {}}
    />
  );
}
