import { render, screen } from '@testing-library/react';
import WalletPage from '@/features/site/wallet';
import { AuthProvider } from '@/context/AuthContext';
import { getStatus, fetchTransactions, fetchPending } from '@/lib/api/wallet';
import { useAuthStore } from '@/app/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      currency: 'EUR',
    });
    (fetchTransactions as jest.Mock).mockResolvedValue({
      realBalance: 200,
      creditBalance: 50,
      transactions: [],
      currency: 'EUR',
    });
    (fetchPending as jest.Mock).mockResolvedValue({
      realBalance: 200,
      creditBalance: 50,
      transactions: [],
      currency: 'EUR',
    });

    const payload = btoa(JSON.stringify({ sub: 'u1' }));
    useAuthStore.setState({ token: `x.${payload}.y` });

    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <WalletPage />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/Real: \$200\.00/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Credit: \$50\.00/),
    ).toBeInTheDocument();
  });
});

