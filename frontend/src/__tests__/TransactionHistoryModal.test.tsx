import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/app/components/common/TransactionHistoryTable', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="tx-table" />),
  };
});

import TransactionHistoryModal, {
  PerformedBy,
} from '@/app/components/modals/TransactionHistoryModal';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import type { AdminTransactionEntry } from '@shared/types';
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
  const entries: AdminTransactionEntry[] = [
    {
      date: '2024-01-01 10:00',
      action: 'Deposit',
      amount: 100,
      performedBy: PerformedBy.User,
      notes: '',
      status: 'Completed',
    },
    {
      date: '2024-01-02 12:00',
      action: 'Withdrawal',
      amount: -50,
      performedBy: PerformedBy.Admin,
      notes: '',
      status: 'Pending',
    },
  ];

  it('uses TransactionHistoryTable and filters data', async () => {
    const onFilter = jest.fn();
    const user = userEvent.setup();
    (fetchTransactionFilters as jest.Mock).mockResolvedValue({
      types: ['Deposit', 'Withdrawal'],
      performedBy: ['Admin', 'User'],
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

    // table rendered via shared component
    expect(await screen.findByTestId('tx-table')).toBeInTheDocument();
    const tableMock = TransactionHistoryTable as unknown as jest.Mock;
    expect(tableMock).toHaveBeenCalled();
    const expectedTableData = entries.map(({ date, performedBy, ...rest }) => ({
      datetime: date,
      by: performedBy,
      ...rest,
    }));
    expect(
      tableMock.mock.calls[tableMock.mock.calls.length - 1][0].data,
    ).toEqual(expectedTableData);

    // apply filter
    await user.selectOptions(screen.getByDisplayValue('All Types'), 'Deposit');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onFilter).toHaveBeenCalledWith([entries[0]]);
    const last = tableMock.mock.calls[tableMock.mock.calls.length - 1][0].data;
    expect(last).toEqual([
      {
        datetime: entries[0].date,
        by: entries[0].performedBy,
        action: entries[0].action,
        amount: entries[0].amount,
        notes: entries[0].notes,
        status: entries[0].status,
      },
    ]);
  });
});
