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
  TransactionEntry,
} from '@/app/components/modals/TransactionHistoryModal';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';

describe('TransactionHistoryModal', () => {
  const entries: TransactionEntry[] = [
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
    render(
      <TransactionHistoryModal
        isOpen
        onClose={() => {}}
        userName="Test"
        entries={entries}
        onFilter={onFilter}
      />,
    );

    // table rendered via shared component
    expect(screen.getByTestId('tx-table')).toBeInTheDocument();
    const tableMock = TransactionHistoryTable as unknown as jest.Mock;
    expect(tableMock).toHaveBeenCalled();
    expect(
      tableMock.mock.calls[tableMock.mock.calls.length - 1][0].data,
    ).toEqual(entries);

    // apply filter
    await user.selectOptions(
      screen.getByDisplayValue('All Types'),
      'Deposit',
    );
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(onFilter).toHaveBeenCalledWith([entries[0]]);
    expect(
      tableMock.mock.calls[tableMock.mock.calls.length - 1][0].data,
    ).toEqual([entries[0]]);
  });
});

