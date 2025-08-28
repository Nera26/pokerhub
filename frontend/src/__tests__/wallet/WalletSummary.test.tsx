import { render, screen } from '@testing-library/react';
import WalletSummary from '@/app/components/wallet/WalletSummary';

describe('WalletSummary', () => {
  it('shows KYC status', () => {
    render(
      <WalletSummary
        realBalance={100}
        creditBalance={50}
        kycVerified={true}
        onDeposit={() => {}}
        onWithdraw={() => {}}
      />,
    );
    expect(screen.getByText(/KYC Status:/i)).toHaveTextContent('Verified');
  });
});
