import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import WalletPage from '@/features/site/wallet';
import { getStatus, fetchTransactions, fetchPending } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet');

const mockedGetStatus = getStatus as jest.MockedFunction<typeof getStatus>;
const mockedFetchTransactions = fetchTransactions as jest.MockedFunction<typeof fetchTransactions>;
const mockedFetchPending = fetchPending as jest.MockedFunction<typeof fetchPending>;

describe('WalletPage integration', () => {
  it('shows balances for logged-in user', async () => {
    mockedGetStatus.mockResolvedValue({
      kycVerified: true,
      realBalance: 1000,
      creditBalance: 50,
    });
    mockedFetchTransactions.mockResolvedValue({
      realBalance: 1000,
      creditBalance: 50,
      transactions: [],
    });
    mockedFetchPending.mockResolvedValue({
      realBalance: 1000,
      creditBalance: 50,
      transactions: [],
    });

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <WalletPage />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes('KYC Status: Verified')),
      ).toBeInTheDocument(),
    );
  });
});
