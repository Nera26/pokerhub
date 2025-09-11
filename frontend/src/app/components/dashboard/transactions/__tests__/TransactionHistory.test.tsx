import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionHistory from '../TransactionHistory';
import {
  fetchTransactionsLog,
  fetchTransactionTypes,
  fetchAdminPlayers,
} from '@/lib/api/wallet';
import { mockFetchSuccess } from '@/hooks/__tests__/utils/renderHookWithClient';

jest.mock('@/lib/api/wallet', () => ({
  fetchTransactionsLog: jest.fn(),
  fetchTransactionTypes: jest.fn(),
  fetchAdminPlayers: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('Dashboard TransactionHistory', () => {
  beforeEach(() => {
    (fetchTransactionTypes as jest.Mock).mockResolvedValue([]);
    (fetchAdminPlayers as jest.Mock).mockResolvedValue([]);
    mockFetchSuccess({});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading state', () => {
    (fetchTransactionsLog as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithClient(<TransactionHistory onExport={() => {}} />);
    expect(screen.getByLabelText('loading history')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
    renderWithClient(<TransactionHistory onExport={() => {}} />);
    expect(
      await screen.findByText('No transaction history.'),
    ).toBeInTheDocument();
  });

  it('calls fetchTransactionsLog with type filter', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([
      {
        datetime: '2024-01-01T00:00:00Z',
        action: 'Deposit',
        amount: 10,
        by: 'Admin',
        notes: '',
        status: 'Completed',
      },
    ]);
    renderWithClient(<TransactionHistory onExport={() => {}} />);

    const select = await screen.findByLabelText('Filter by type');
    fireEvent.change(select, { target: { value: 'deposit' } });

    await waitFor(() =>
      expect(
        (fetchTransactionsLog as jest.Mock).mock.calls.some(
          (c: any[]) => c[0].type === 'deposit',
        ),
      ).toBe(true),
    );
  });
});
