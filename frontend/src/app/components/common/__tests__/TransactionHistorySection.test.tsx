import { render, screen } from '@testing-library/react';
import TransactionHistorySection from '../TransactionHistorySection';

const columnIndex = { value: 1 };

jest.mock('../../dashboard/transactions/TransactionHistory', () => ({
  __esModule: true,
  default: ({ columns, data }: any) => (
    <div>{columns[columnIndex.value].cell(data[0])}</div>
  ),
}));

describe('TransactionHistorySection', () => {
  it('formats amounts using provided currency', () => {
    columnIndex.value = 1;
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

  it('maps status codes to labels and styles', () => {
    columnIndex.value = 3;
    const data = [
      { amount: 10, status: 'pending', date: '2024-01-01', type: 'Deposit' },
    ];

    render(<TransactionHistorySection data={data} currency="USD" />);

    const statusEl = screen.getByText('Pending');
    expect(statusEl).toHaveClass('bg-accent-yellow/20');
    expect(statusEl).toHaveClass('text-accent-yellow');
  });
});
