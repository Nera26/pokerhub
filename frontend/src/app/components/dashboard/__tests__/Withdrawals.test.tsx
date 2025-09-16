import { screen } from '@testing-library/react';
import Withdrawals from '../Withdrawals';
import { fetchPendingWithdrawals } from '@/lib/api';
import { setupTransactionTestData } from '../transactions/test-utils';

jest.mock('@/lib/api', () => ({
  fetchPendingWithdrawals: jest.fn(),
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

  let renderWithClient: ReturnType<
    typeof setupTransactionTestData
  >['renderWithClient'];

  beforeEach(() => {
    jest.clearAllMocks();
    ({ renderWithClient } = setupTransactionTestData());
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
