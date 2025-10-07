import { render, screen } from '@testing-library/react';
import WalletSummary from '@/components/wallet/wallet-summary';

describe('WalletSummary', () => {
  it('shows KYC status', () => {
    render(
      <WalletSummary
        realBalance={100}
        creditBalance={50}
        kycVerified={true}
        onDeposit={() => {}}
        onWithdraw={() => {}}
        onVerify={() => {}}
        currency="USD"
      />, 
    );
    expect(screen.getByText(/KYC Status:/i)).toHaveTextContent('Verified');
  });

  it('shows verify button when not verified', () => {
    render(
      <WalletSummary
        realBalance={100}
        creditBalance={50}
        kycVerified={false}
        onDeposit={() => {}}
        onWithdraw={() => {}}
        onVerify={() => {}}
        currency="USD"
      />, 
    );
    expect(screen.getByText(/Verify/i)).toBeInTheDocument();
  });
});
