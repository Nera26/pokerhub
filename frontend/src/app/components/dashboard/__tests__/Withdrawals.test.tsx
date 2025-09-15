import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import Withdrawals from '../Withdrawals';
import { fetchPendingWithdrawals } from '@/lib/api';
import { mockMetadataFetch } from '../../common/__tests__/helpers';

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

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPendingWithdrawals as jest.Mock).mockResolvedValue({
      withdrawals: [withdrawal],
    });
    mockMetadataFetch({
      columns: [
        { id: 'type', label: 'Type' },
        { id: 'amount', label: 'Amount' },
        { id: 'date', label: 'Date' },
        { id: 'status', label: 'Status' },
      ],
    });
  });

  it('renders review action', async () => {
    renderWithClient(<Withdrawals />);
    const reviewBtn = await screen.findByRole('button', { name: /review/i });
    expect(reviewBtn).toBeInTheDocument();
  });
});
