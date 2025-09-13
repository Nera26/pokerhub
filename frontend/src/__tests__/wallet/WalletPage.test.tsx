import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from '@/features/wallet';
import { useWalletStatus, useIban } from '@/hooks/wallet';
import BankTransferModal from '@/app/components/wallet/BankTransferModal';

jest.mock('@/hooks/wallet', () => ({
  useWalletStatus: jest.fn(),
  useIban: jest.fn(),
}));

jest.mock('@/app/components/wallet/BankTransferModal', () => ({
  __esModule: true,
  default: jest.fn(({ mode }) => <div>{mode} modal</div>),
}));

const walletData = {
  kycVerified: true,
  realBalance: 100,
  creditBalance: 50,
  currency: 'EUR',
};

const ibanData = {
  iban: 'DE123',
  masked: '****1234',
  holder: 'Jane Doe',
  instructions: '',
  updatedBy: '',
  updatedAt: new Date().toISOString(),
};

(useWalletStatus as jest.Mock).mockReturnValue({ data: walletData });
(useIban as jest.Mock).mockReturnValue({ data: ibanData });

describe('WalletPage', () => {
  it('opens deposit and withdraw modals', async () => {
    render(<WalletPage />);
    await userEvent.click(screen.getByRole('button', { name: /deposit/i }));
    expect(screen.getByText('deposit modal')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(screen.getByText('withdraw modal')).toBeInTheDocument();
  });
});
