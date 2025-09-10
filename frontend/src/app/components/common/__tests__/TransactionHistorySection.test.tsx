import { render, screen } from '@testing-library/react';
import TransactionHistorySection from '../TransactionHistorySection';

jest.mock('../../dashboard/transactions/TransactionHistory', () => ({
  __esModule: true,
  default: ({ columns, data }: any) => <div>{columns[1].cell(data[0])}</div>,
}));

describe('TransactionHistorySection', () => {
  it('formats amounts using provided currency', () => {
    const data = [
      { amount: 10, status: 'Completed', date: '2024-01-01', type: 'Deposit' },
    ];

    render(<TransactionHistorySection data={data} currency="EUR" />);

    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(10);

    expect(screen.getByText(`+${formatted}`)).toBeInTheDocument();
  });
});
