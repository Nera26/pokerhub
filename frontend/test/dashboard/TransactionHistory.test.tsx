import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionHistory from '@/app/components/dashboard/transactions/TransactionHistory';
import {
  fetchTransactionsLog,
  fetchAdminPlayers,
  fetchTransactionTypes,
} from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet', () => ({
  fetchTransactionsLog: jest.fn(),
  fetchAdminPlayers: jest.fn(),
  fetchTransactionTypes: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  (fetchAdminPlayers as jest.Mock).mockResolvedValue([]);
  (fetchTransactionTypes as jest.Mock).mockResolvedValue([]);
});

test('shows loading state', () => {
  (fetchTransactionsLog as jest.Mock).mockReturnValue(new Promise(() => {}));
  renderWithClient(<TransactionHistory />);
  expect(screen.getByLabelText('loading history')).toBeInTheDocument();
});

test('shows empty state', async () => {
  (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
  renderWithClient(<TransactionHistory />);
  expect(
    await screen.findByText('No transaction history.'),
  ).toBeInTheDocument();
});

test('applies date filters', async () => {
  (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
  renderWithClient(<TransactionHistory />);
  const startInput = await screen.findByLabelText('Start date');
  const endInput = screen.getByLabelText('End date');
  await act(async () => {
    fireEvent.change(startInput, { target: { value: '2024-01-01' } });
  });
  await waitFor(() =>
    expect(fetchTransactionsLog).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: '2024-01-01' }),
    ),
  );
});
