import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Withdrawals from '../Withdrawals';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { rejectWithdrawal } from '@/lib/api/withdrawals';

jest.mock('@/hooks/useWithdrawals');
jest.mock('@/lib/api/withdrawals', () => ({
  rejectWithdrawal: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('Withdrawals', () => {
  const refetch = jest.fn();
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
    (useWithdrawals as jest.Mock).mockReturnValue({
      data: [withdrawal],
      refetch,
      isLoading: false,
    });
  });

  it('requires reason to reject', async () => {
    renderWithClient(<Withdrawals />);
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));
    await screen.findByText(/reason is required/i);
    expect(rejectWithdrawal).not.toHaveBeenCalled();
  });

  it('rejects withdrawal and refreshes list', async () => {
    (rejectWithdrawal as jest.Mock).mockResolvedValue(withdrawal);
    renderWithClient(<Withdrawals />);
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    fireEvent.change(screen.getByPlaceholderText(/enter reason/i), {
      target: { value: 'fraud' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));
    await waitFor(() =>
      expect(rejectWithdrawal).toHaveBeenCalledWith('1', 'fraud'),
    );
    expect(refetch).toHaveBeenCalled();
  });
});
