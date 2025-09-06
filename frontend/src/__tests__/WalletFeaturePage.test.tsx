import { render, screen } from '@testing-library/react';
import WalletPage from '@/features/wallet';
import { AuthProvider } from '@/context/AuthContext';
import { getStatus } from '@/lib/api/wallet';
import { useAuthStore } from '@/app/store/authStore';

jest.mock('@/lib/api/wallet');

describe('WalletPage', () => {
  afterEach(() => {
    useAuthStore.setState({ token: null });
    jest.clearAllMocks();
  });

  it('renders balances from server', async () => {
    (getStatus as jest.Mock).mockResolvedValue({
      kycVerified: true,
      realBalance: 200,
      creditBalance: 50,
    });

    const payload = btoa(JSON.stringify({ sub: 'u1' }));
    useAuthStore.setState({ token: `x.${payload}.y` });

    render(
      <AuthProvider>
        <WalletPage />
      </AuthProvider>,
    );

    expect(
      await screen.findByText(/Real Balance: 200/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Credit Balance: 50/),
    ).toBeInTheDocument();
  });
});
