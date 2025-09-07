jest.mock('@/app/components/common/transactionColumns', () => {
  const actual = jest.requireActual(
    '@/app/components/common/transactionColumns',
  ) as typeof import('@/app/components/common/transactionColumns');
  return {
    __esModule: true,
    ...actual,
    buildTransactionColumns: jest.fn(actual.buildTransactionColumns),
  };
});

import { render, screen } from '@testing-library/react';
import { buildTransactionColumns } from '@/app/components/common/transactionColumns';
import TransactionHistory from '../TransactionHistory';

describe('TransactionHistory', () => {
  it('renders provided transactions', () => {
    const transactions = [
      {
        id: '1',
        type: 'Deposit',
        amount: 50,
        date: 'Jan 1, 2024',
        status: 'Completed',
      },
      {
        id: '2',
        type: 'Withdraw',
        amount: -20,
        date: 'Jan 2, 2024',
        status: 'Processing',
      },
    ];
    render(<TransactionHistory transactions={transactions} currency="USD" />);

    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('+$50.00')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('-$20.00')).toBeInTheDocument();
  });

  it('builds columns with expected options', () => {
    render(
      <TransactionHistory
        transactions={[
          { id: '1', type: 'Deposit', amount: 10, date: 'Jan 1', status: 'Done' },
        ]}
        currency="USD"
      />,
    );
    expect(buildTransactionColumns).toHaveBeenCalledWith({
      getType: expect.any(Function),
      headerClassName:
        'text-left p-4 font-semibold text-text-secondary text-sm uppercase',
      cellClassName: 'p-4 text-sm',
      currency: 'USD',
    });
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionHistory transactions={[]} currency="USD" />);
    expect(
      screen.getByText('No transaction history found.'),
    ).toBeInTheDocument();
  });
});
