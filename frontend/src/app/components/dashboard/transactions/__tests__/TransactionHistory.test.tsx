import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test-utils/server';
import { mockSuccess } from '@/test-utils/handlers';
import TransactionHistory from '../TransactionHistory';
import {
  fetchTransactionsLog,
  fetchTransactionTypes,
} from '@/lib/api/transactions';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import { mockMetadataFetch } from '../../../common/__tests__/helpers';

jest.mock('@/lib/api/transactions', () => ({
  fetchTransactionsLog: jest.fn(),
  fetchTransactionTypes: jest.fn(),
}));
jest.mock('@/lib/api/wallet', () => ({
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
    server.use(mockSuccess({}));
    mockMetadataFetch({
      columns: [
        { id: 'type', label: 'Type' },
        { id: 'amount', label: 'Amount' },
        { id: 'date', label: 'Date' },
        { id: 'status', label: 'Status' },
      ],
    });
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

  it('requests next page on pagination', async () => {
    const logData = Array.from({ length: 10 }, (_, i) => ({
      datetime: `2024-01-0${i + 1}T00:00:00Z`,
      action: 'Deposit',
      amount: 10,
      by: 'Admin',
      notes: '',
      status: 'Completed',
    }));
    (fetchTransactionsLog as jest.Mock).mockResolvedValue(logData);
    renderWithClient(<TransactionHistory onExport={() => {}} />);
    const next = await screen.findByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await waitFor(() =>
      expect((fetchTransactionsLog as jest.Mock).mock.calls[1][0].page).toBe(2),
    );
  });

  it('triggers export callback', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
    const onExport = jest.fn();
    renderWithClient(<TransactionHistory onExport={onExport} />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);
    expect(onExport).toHaveBeenCalled();
  });
});
