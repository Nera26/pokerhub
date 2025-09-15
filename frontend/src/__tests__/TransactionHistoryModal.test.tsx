import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/app/components/common/TransactionHistoryTable', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="tx-table" />),
  };
});

jest.mock('@/hooks/useTransactionColumns', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import TransactionHistoryModal from '@/app/components/modals/TransactionHistoryModal';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import { z } from 'zod';
import { AdminTransactionEntriesSchema } from '@shared/transactions.schema';

type AdminTransactionEntry = z.infer<
  typeof AdminTransactionEntriesSchema
>[number];
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fetchTransactionFilters,
  fetchUserTransactions,
} from '@/lib/api/transactions';

jest.mock('@/lib/api/transactions', () => ({
  fetchTransactionFilters: jest.fn(),
  fetchUserTransactions: jest.fn(),
}));

describe('TransactionHistoryModal', () => {
  const columnsMeta = [
    { id: 'datetime', label: 'Date & Time' },
    { id: 'action', label: 'Action' },
    { id: 'amount', label: 'Amount' },
    { id: 'by', label: 'Performed By' },
    { id: 'notes', label: 'Notes' },
    { id: 'status', label: 'Status' },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders fetched columns and filters data', async () => {
    const entries: Array<AdminTransactionEntry & { currency?: string }> = [
      {
        date: '2024-01-01 10:00',
        action: 'Deposit',
        amount: 100,
        performedBy: 'User',
        notes: '',
        status: 'Completed',
        currency: 'EUR',
      },
      {
        date: '2024-01-02 12:00',
        action: 'Withdrawal',
        amount: -50,
        performedBy: 'Admin',
        notes: '',
        status: 'Pending',
        currency: 'EUR',
      },
    ];

    (useTransactionColumns as jest.Mock).mockReturnValue({
      data: columnsMeta,
      isLoading: false,
      error: null,
    });
    const onFilter = jest.fn();
    const user = userEvent.setup();
    (fetchTransactionFilters as jest.Mock).mockResolvedValue({
      types: ['All Types', 'Deposit', 'Withdrawal'],
      performedBy: ['All', 'Admin', 'User'],
    });
    (fetchUserTransactions as jest.Mock).mockResolvedValue(entries);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TransactionHistoryModal
          isOpen
          onClose={() => {}}
          userName="Test"
          userId="1"
          onFilter={onFilter}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId('tx-table')).toBeInTheDocument();
    const tableMock = TransactionHistoryTable as unknown as jest.Mock;
    const call = tableMock.mock.calls[tableMock.mock.calls.length - 1][0];
    expect(call.columns.map((c: any) => c.header)).toEqual(
      columnsMeta.map((c) => c.label),
    );

    const expectedTableData = entries.map(({ date, performedBy, ...rest }) => ({
      datetime: date,
      by: performedBy,
      ...rest,
    }));
    expect(call.data).toEqual(expectedTableData);

    await user.selectOptions(screen.getByDisplayValue('All Types'), 'Deposit');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onFilter).toHaveBeenCalledWith([entries[0]]);
  });

  it.each([{ currency: 'EUR' }, { currency: undefined }])(
    'formats amounts using currency %#',
    async ({ currency }) => {
      const entries: Array<AdminTransactionEntry & { currency?: string }> = [
        {
          date: '2024-01-01 10:00',
          action: 'Deposit',
          amount: 100,
          performedBy: 'User',
          notes: '',
          status: 'Completed',
          ...(currency ? { currency } : {}),
        },
      ];

      (useTransactionColumns as jest.Mock).mockReturnValue({
        data: columnsMeta,
        isLoading: false,
        error: null,
      });
      (fetchTransactionFilters as jest.Mock).mockResolvedValue({
        types: ['All Types'],
        performedBy: ['All'],
      });
      (fetchUserTransactions as jest.Mock).mockResolvedValue(entries);
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={client}>
          <TransactionHistoryModal
            isOpen
            onClose={() => {}}
            userName="Test"
            userId="1"
          />
        </QueryClientProvider>,
      );

      await screen.findByTestId('tx-table');
      const tableMock = TransactionHistoryTable as unknown as jest.Mock;
      const { columns, data } = tableMock.mock.calls[0][0];
      const amountCol = columns.find((c: any) => c.header === 'Amount');
      const { getByText } = render(amountCol.cell(data[0]));
      const expected = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency ?? 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(100);
      expect(getByText(`+${expected}`)).toBeInTheDocument();
    },
  );

  it('shows error when data fetching fails', async () => {
    (useTransactionColumns as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('fail'),
    });
    (fetchTransactionFilters as jest.Mock).mockRejectedValue(new Error('fail'));
    (fetchUserTransactions as jest.Mock).mockRejectedValue(new Error('fail'));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <TransactionHistoryModal
          isOpen
          onClose={() => {}}
          userName="Test"
          userId="1"
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('Failed to load transactions'),
    ).toBeInTheDocument();
  });
});
