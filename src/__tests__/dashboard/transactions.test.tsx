import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusPill from '@/app/components/dashboard/transactions/StatusPill';
import DepositTable from '@/app/components/dashboard/transactions/DepositTable';
import WithdrawalTable from '@/app/components/dashboard/transactions/WithdrawalTable';
import TransactionHistory from '@/app/components/dashboard/transactions/TransactionHistory';
import type {
  DepositReq,
  WithdrawalReq,
  Txn,
} from '@/app/components/dashboard/transactions/types';

jest.mock(
  'next/image',
  () => (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
);

describe('transaction components', () => {
  it('renders StatusPill', () => {
    render(<StatusPill status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('handles DepositTable actions', async () => {
    const deposits: DepositReq[] = [
      {
        id: '1',
        user: 'User',
        avatar: '/avatar.png',
        amount: 100,
        method: 'Bank',
        date: '2024-01-01',
        receiptUrl: '/r',
        status: 'Pending',
      },
    ];
    const approve = jest.fn();
    const reject = jest.fn();
    const comment = jest.fn();
    const receipt = jest.fn();
    const user = userEvent.setup();
    render(
      <DepositTable
        deposits={deposits}
        onApprove={approve}
        onReject={reject}
        onAddComment={comment}
        onViewReceipt={receipt}
      />,
    );
    const depositUser = await screen.findByText('User');
    expect(depositUser.closest('tr')).toHaveAttribute('data-index', '0');
    await act(async () => {
      await user.click(screen.getByText('Approve'));
    });
    expect(approve).toHaveBeenCalledWith('1');
    await act(async () => {
      await user.click(screen.getByText('Reject'));
    });
    expect(reject).toHaveBeenCalledWith('1');
    await act(async () => {
      await user.click(screen.getByTitle('Add Comment'));
    });
    expect(comment).toHaveBeenCalledWith('1');
    await act(async () => {
      await user.click(screen.getByTitle('View Receipt'));
    });
    expect(receipt).toHaveBeenCalled();
  });

  it('handles WithdrawalTable actions', async () => {
    const withdrawals: WithdrawalReq[] = [
      {
        id: 'w1',
        user: 'User',
        avatar: '/avatar.png',
        amount: 50,
        bank: 'Bank',
        masked: '****',
        date: '2024-01-01',
        comment: 'Test',
        status: 'Pending',
      },
    ];
    const approve = jest.fn();
    const reject = jest.fn();
    const user = userEvent.setup();
    render(
      <WithdrawalTable
        withdrawals={withdrawals}
        onApprove={approve}
        onReject={reject}
      />,
    );
    const withdrawalUser = await screen.findByText('User');
    expect(withdrawalUser.closest('tr')).toHaveAttribute('data-index', '0');
    await act(async () => {
      await user.click(screen.getByText('Approve'));
    });
    expect(approve).toHaveBeenCalledWith('w1');
    await act(async () => {
      await user.click(screen.getByText('Reject'));
    });
    expect(reject).toHaveBeenCalledWith('w1');
  });

  it('renders TransactionHistory and exports', async () => {
    const log: Txn[] = [
      {
        datetime: '2024-01-01',
        action: 'Deposit',
        amount: 100,
        by: 'Admin',
        notes: 'note',
        status: 'Completed',
      },
    ];
    const exportCSV = jest.fn();
    const user = userEvent.setup();
    render(
      <TransactionHistory
        log={log}
        pageInfo="Showing 1-1 of 1 transactions"
        onExport={exportCSV}
      />,
    );
    expect(screen.getByText('Unified Transaction Log')).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByText(/Export CSV/));
    });
    expect(exportCSV).toHaveBeenCalled();
  });
});
