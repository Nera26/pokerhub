import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusPill from '@/app/components/dashboard/transactions/StatusPill';
import RequestTable from '@/app/components/dashboard/transactions/RequestTable';
import TransactionHistory from '@/app/components/dashboard/transactions/TransactionHistory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faComment } from '@fortawesome/free-solid-svg-icons';
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

  it('handles deposit request columns and actions', async () => {
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
      <RequestTable
        title="Deposits"
        rows={deposits}
        columns={[
          { label: 'Player', render: (d) => <span>{d.user}</span> },
          { label: 'Amount', render: (d) => <span>${d.amount}</span> },
          { label: 'Method', render: (d) => d.method },
          { label: 'Date', render: (d) => <span>{d.date}</span> },
          {
            label: 'Receipt',
            render: (d) => (
              <button
                onClick={() => receipt(d.receiptUrl)}
                title="View Receipt"
                aria-label="View receipt"
              >
                <FontAwesomeIcon icon={faImage} />
              </button>
            ),
          },
        ]}
        actions={[
          {
            label: 'Approve',
            onClick: (d) => approve(d.id),
            className: 'approve',
          },
          {
            label: 'Reject',
            onClick: (d) => reject(d.id),
            className: 'reject',
          },
          {
            icon: faComment,
            onClick: (d) => comment(d.id),
            className: 'comment',
            title: 'Add Comment',
            ariaLabel: 'Add comment',
          },
        ]}
      />,
    );
    ['Player', 'Amount', 'Method', 'Date', 'Receipt', 'Status', 'Action'].forEach(
      (header) => {
        expect(
          screen.getByRole('columnheader', { name: header }),
        ).toBeInTheDocument();
      },
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

  it('handles withdrawal request columns and actions', async () => {
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
      <RequestTable
        title="Withdrawals"
        rows={withdrawals}
        columns={[
          { label: 'Player', render: (w) => <span>{w.user}</span> },
          { label: 'Amount', render: (w) => <span>${w.amount}</span> },
          { label: 'Bank Info', render: (w) => <span>{w.bank}</span> },
          { label: 'Date', render: (w) => <span>{w.date}</span> },
          { label: 'Comment', render: (w) => <span>{w.comment}</span> },
        ]}
        actions={[
          {
            label: 'Approve',
            onClick: (w) => approve(w.id),
            className: 'approve',
          },
          {
            label: 'Reject',
            onClick: (w) => reject(w.id),
            className: 'reject',
          },
        ]}
      />,
    );
    ['Player', 'Amount', 'Bank Info', 'Date', 'Comment', 'Status', 'Action'].forEach(
      (header) => {
        expect(
          screen.getByRole('columnheader', { name: header }),
        ).toBeInTheDocument();
      },
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
      <TransactionHistory log={log} onExport={exportCSV} />,
    );
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByText(/Export CSV/));
    });
    expect(exportCSV).toHaveBeenCalled();
  });
});
