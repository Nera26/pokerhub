import { render, screen } from '@testing-library/react';
import WalletPage from '../page';
import { useWalletStatus } from '@/hooks/wallet';

jest.mock('@/hooks/wallet', () => ({
  useWalletStatus: jest.fn(),
}));

describe('WalletPage', () => {
  beforeEach(() => {
    (useWalletStatus as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (useWalletStatus as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<WalletPage />);
    expect(screen.getByText(/loading wallet/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useWalletStatus as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    render(<WalletPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /failed to load wallet/i,
    );
  });

  it('shows empty state', () => {
    (useWalletStatus as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<WalletPage />);
    expect(screen.getByText(/no wallet data/i)).toBeInTheDocument();
  });

  it('matches snapshot when KYC verified', () => {
    (useWalletStatus as jest.Mock).mockReturnValue({
      data: {
        realBalance: 100,
        creditBalance: 50,
        kycVerified: true,
        currency: 'USD',
      },
      isLoading: false,
      error: null,
    });
    const { container } = render(<WalletPage />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when KYC pending', () => {
    (useWalletStatus as jest.Mock).mockReturnValue({
      data: {
        realBalance: 100,
        creditBalance: 50,
        kycVerified: false,
        currency: 'USD',
      },
      isLoading: false,
      error: null,
    });
    const { container } = render(<WalletPage />);
    expect(container).toMatchSnapshot();
  });
});
