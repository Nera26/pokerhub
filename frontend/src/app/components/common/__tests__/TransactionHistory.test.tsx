import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../TransactionHistory';

const columns = [
  {
    header: 'Action',
    cell: (row: { action: string }) => row.action,
  },
];

const data = [
  { date: '2024-01-01', action: 'Deposit' },
];

describe('TransactionHistory pagination', () => {
  it('calls onPageChange when navigating', async () => {
    const onPageChange = jest.fn();
    const user = userEvent.setup();
    render(
      <TransactionHistory
        data={data}
        columns={columns}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByText('Previous'));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });
});
