import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WalletPage from '@/features/wallet';
import { getStatus } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet');

describe('WalletPage', () => {
  it('renders balances from server', async () => {
    (getStatus as jest.Mock).mockResolvedValue({
      kycVerified: true,
      realBalance: 200,
      creditBalance: 50,
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <WalletPage />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/Real Balance: 200/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Credit Balance: 50/),
    ).toBeInTheDocument();
  });
});
