import { render, screen } from '@testing-library/react';
import VirtualizedGrid from '../VirtualizedGrid';

type User = {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
  avatar: string;
};

type Withdrawal = {
  user: string;
  amount: string;
  date: string;
  status: string;
  avatar: string;
};

describe('VirtualizedGrid', () => {
  it('renders users and virtualizes long lists', () => {
    const users: User[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `u${i}@example.com`,
      balance: i * 10,
      status: 'Active',
      avatar: '',
    }));
    render(
      <VirtualizedGrid<User>
        items={users}
        columns={[
          { label: 'ID', span: 1 },
          { label: 'Name', span: 3 },
          { label: 'Balance', span: 2 },
          { label: 'Status', span: 2 },
          { label: 'Actions', span: 4 },
        ]}
        testId="users-grid-test"
        rowRenderer={(u, style) => (
          <div key={u.id} style={style} className="grid grid-cols-12">
            <div className="col-span-1">{u.id}</div>
            <div className="col-span-3">{u.name}</div>
            <div className="col-span-2">{u.balance}</div>
            <div className="col-span-2">{u.status}</div>
            <div className="col-span-4">-</div>
          </div>
        )}
      />,
    );
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.getByTestId('users-grid-test')).toHaveAttribute(
      'data-virtualized',
      'true',
    );
  });

  it('renders withdrawals and virtualizes long lists', () => {
    const withdrawals: Withdrawal[] = Array.from({ length: 25 }, (_, i) => ({
      user: `User ${i}`,
      amount: `$${i}`,
      date: `2024-01-${i}`,
      status: 'Pending',
      avatar: '',
    }));
    render(
      <VirtualizedGrid<Withdrawal>
        items={withdrawals}
        columns={[
          { label: 'User', span: 2 },
          { label: 'Amount', span: 2 },
          { label: 'Date', span: 2 },
          { label: 'Status', span: 2 },
          { label: 'Actions', span: 4 },
        ]}
        testId="withdrawals-grid-test"
        estimateSize={72}
        rowRenderer={(w, style) => (
          <div key={w.user} style={style} className="grid grid-cols-12">
            <div className="col-span-2">{w.user}</div>
            <div className="col-span-2">{w.amount}</div>
            <div className="col-span-2">{w.date}</div>
            <div className="col-span-2">{w.status}</div>
            <div className="col-span-4">-</div>
          </div>
        )}
      />,
    );
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(
      screen.getByTestId('withdrawals-grid-test'),
    ).toHaveAttribute('data-virtualized', 'true');
  });
});
