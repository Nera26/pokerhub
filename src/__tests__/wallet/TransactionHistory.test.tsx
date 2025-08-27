import { render, screen } from '@testing-library/react';
import TransactionHistory from '@/app/components/wallet/TransactionHistory';

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
    render(<TransactionHistory transactions={transactions} />);

    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('+$50.00')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('-$20.00')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionHistory transactions={[]} />);
    expect(
      screen.getByText('No transaction history found.'),
    ).toBeInTheDocument();
  });
});
