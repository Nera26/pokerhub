import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../TransactionHistory';
import {
  fetchTransactionsLog,
  fetchTransactionTypes,
} from '@/lib/api/transactions';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import { exportCsv } from '@/lib/exportCsv';
import { setupTransactionTestData } from './test-utils';

jest.mock('@/lib/api/transactions', () => ({
  fetchTransactionsLog: jest.fn(),
  fetchTransactionTypes: jest.fn(),
}));
jest.mock('@/lib/api/wallet', () => ({
  fetchAdminPlayers: jest.fn(),
}));
jest.mock('@/lib/exportCsv', () => ({
  exportCsv: jest.fn(),
}));

describe('Dashboard TransactionHistory', () => {
  let renderWithClient: ReturnType<
    typeof setupTransactionTestData
  >['renderWithClient'];

  beforeEach(() => {
    ({ renderWithClient } = setupTransactionTestData());
    (fetchTransactionTypes as jest.Mock).mockResolvedValue([
      { id: 'deposit', label: 'Deposit' },
    ]);
    (fetchAdminPlayers as jest.Mock).mockResolvedValue([
      { id: 'player-1', username: 'Alice' },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading state', () => {
    (fetchTransactionsLog as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithClient(<TransactionHistory />);
    expect(screen.getByLabelText('loading history')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
    renderWithClient(<TransactionHistory />);
    expect(
      await screen.findByText('No transaction history.'),
    ).toBeInTheDocument();
  });

  it('shows error state when fetching fails', async () => {
    (fetchTransactionsLog as jest.Mock).mockRejectedValue(new Error('fail'));
    renderWithClient(<TransactionHistory />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to load transaction history.');
  });

  it('renders player filter options', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([]);
    renderWithClient(<TransactionHistory />);

    const option = await screen.findByRole('option', { name: 'Alice' });
    expect(option).toBeInTheDocument();
  });

  it('calls fetchTransactionsLog with type filter', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([
      {
        datetime: '2024-01-01T00:00:00Z',
        date: '2024-01-01',
        action: 'Deposit',
        amount: 10,
        by: 'Admin',
        notes: '',
        status: 'Completed',
      },
    ]);
    renderWithClient(<TransactionHistory />);

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
      date: `2024-01-0${i + 1}`,
      action: 'Deposit',
      amount: 10,
      by: 'Admin',
      notes: '',
      status: 'Completed',
    }));
    (fetchTransactionsLog as jest.Mock).mockResolvedValue(logData);
    renderWithClient(<TransactionHistory />);
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
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('exports current log when no handler provided', async () => {
    (fetchTransactionsLog as jest.Mock).mockResolvedValue([
      {
        datetime: '2024-01-01T00:00:00Z',
        action: 'Deposit',
        amount: 25,
        by: 'Admin',
        notes: 'Initial deposit',
        status: 'Completed',
      },
    ]);

    renderWithClient(<TransactionHistory />);
    const btn = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(btn);

    expect(exportCsv).toHaveBeenCalledWith(
      expect.stringMatching(/^transactions_\d{4}-\d{2}-\d{2}\.csv$/),
      ['Date/Time', 'Action', 'Amount', 'By', 'Notes', 'Status'],
      [
        [
          '2024-01-01T00:00:00Z',
          'Deposit',
          'USD 25',
          'Admin',
          'Initial deposit',
          'Completed',
        ],
      ],
    );
  });
});
