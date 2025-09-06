import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WalletPage from '@/features/site/wallet';
import { AuthProvider } from '@/context/AuthContext';
import { useAuthStore } from '@/app/store/authStore';
import {
  getStatus,
  fetchTransactions,
  fetchPending,
  fetchBankAccount,
} from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet');

function setup() {
  (getStatus as jest.Mock).mockResolvedValue({
    kycVerified: true,
    realBalance: 100,
    creditBalance: 0,
  });
  (fetchTransactions as jest.Mock).mockResolvedValue({
    realBalance: 100,
    creditBalance: 0,
    transactions: [],
  });
  (fetchPending as jest.Mock).mockResolvedValue({
    realBalance: 100,
    creditBalance: 0,
    transactions: [],
  });

  const payload = btoa(JSON.stringify({ sub: 'u1' }));
  useAuthStore.setState({ token: `x.${payload}.y` });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <WalletPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('WalletPage withdraw modal bank account', () => {
  afterEach(() => {
    useAuthStore.setState({ token: null });
    jest.clearAllMocks();
  });

  it('shows loading state', async () => {
    (fetchBankAccount as jest.Mock).mockReturnValue(new Promise(() => {}));
    setup();
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(
      await screen.findByText(/loading bank account/i),
    ).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (fetchBankAccount as jest.Mock).mockRejectedValue(new Error('fail'));
    setup();
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/failed to load bank account/i),
      ).toBeInTheDocument(),
    );
  });

  it('renders bank info on success', async () => {
    (fetchBankAccount as jest.Mock).mockResolvedValue({
      accountNumber: '1234',
      tier: 'Gold',
      holder: 'Jane',
    });
    setup();
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    await waitFor(() => expect(fetchBankAccount).toHaveBeenCalled());
    expect(await screen.findByText('1234')).toBeInTheDocument();
    expect(await screen.findByText('Gold')).toBeInTheDocument();
    expect(await screen.findByText('Jane')).toBeInTheDocument();
  });
});
