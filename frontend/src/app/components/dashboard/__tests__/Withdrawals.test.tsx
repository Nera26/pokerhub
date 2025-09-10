import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import Withdrawals from '../Withdrawals';
import { fetchPendingWithdrawals } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet', () => ({
  fetchPendingWithdrawals: jest.fn(),
}));

jest.mock('../transactions/TransactionHistory', () => ({
  __esModule: true,
  default: ({ actions, data }: any) => (
    <div>
      {actions?.map((a: any, i: number) => (
        <button key={i} onClick={() => a.onClick(data[0])}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}));

describe('Withdrawals', () => {
  const withdrawal = {
    id: '1',
    userId: 'user1',
    amount: 100,
    currency: 'USD',
    status: 'pending',
    createdAt: new Date().toISOString(),
    avatar: '',
    bank: 'bank',
    maskedAccount: '****',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue({
      withdrawals: [withdrawal],
    });
  });

  it('renders review action', async () => {
    renderWithClient(<Withdrawals />);
    const reviewBtn = await screen.findByRole('button', { name: /review/i });
    expect(reviewBtn).toBeInTheDocument();
  });
});
