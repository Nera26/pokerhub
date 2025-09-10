import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import Withdrawals from '../Withdrawals';
import { fetchPendingWithdrawals, rejectWithdrawal } from '@/lib/api/wallet';

jest.mock('@/lib/api/wallet', () => ({
  fetchPendingWithdrawals: jest.fn(),
  rejectWithdrawal: jest.fn(),
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

  it('requires reason to reject', async () => {
    renderWithClient(<Withdrawals />);
    await screen.findByRole('button', { name: /review/i });
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    expect(rejectBtn).toBeDisabled();
    fireEvent.click(rejectBtn);
    expect(rejectWithdrawal).not.toHaveBeenCalled();
  });

  it('rejects withdrawal and refreshes list', async () => {
    (rejectWithdrawal as jest.Mock).mockResolvedValue({});
    renderWithClient(<Withdrawals />);
    await screen.findByRole('button', { name: /review/i });
    fireEvent.click(screen.getByRole('button', { name: /review/i }));
    fireEvent.change(screen.getByPlaceholderText(/enter reason/i), {
      target: { value: 'fraud' },
    });
    const rejectBtn = screen.getByRole('button', { name: /^reject$/i });
    await waitFor(() => expect(rejectBtn).toBeEnabled());
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      expect(rejectWithdrawal).toHaveBeenCalledWith('1', 'fraud'),
    );
    await waitFor(() =>
      expect(fetchPendingWithdrawals).toHaveBeenCalledTimes(2),
    );
  });
});
