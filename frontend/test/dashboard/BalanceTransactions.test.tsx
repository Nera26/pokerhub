import { render, screen } from '@testing-library/react';
import BalanceTransactions from '@/app/components/dashboard/BalanceTransactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWalletReconcileMismatches } from '@/hooks/wallet';

jest.mock('@tanstack/react-query');
jest.mock('@/hooks/wallet', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/wallet'),
  useWalletReconcileMismatches: jest.fn(),
}));

describe('BalanceTransactions component states', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    (useQuery as jest.Mock).mockReset();
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: { mismatches: [] },
      isLoading: false,
      error: null,
    });
  });

  it('shows placeholders when data is empty', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByText('No pending deposits.')).toBeInTheDocument();
    expect(screen.getByText('No user balances.')).toBeInTheDocument();
    expect(screen.getByText('No transaction history.')).toBeInTheDocument();
  });

  it('shows API error message for transaction log', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: { message: 'fail' } })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByRole('alert')).toHaveTextContent('fail');
  });

  it('renders tabs from API', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: [
          { id: 'all', label: 'All' },
          { id: 'manual', label: 'Manual Adjustments' },
        ],
        isLoading: false,
        error: null,
      })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByText('Manual Adjustments')).toBeInTheDocument();
  });

  it('renders wallet reconcile mismatches table', () => {
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: { mismatches: [{ date: '2024-01-01', total: 100 }] },
      isLoading: false,
      error: null,
    });
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('shows error message for mismatches', () => {
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'boom' },
    });
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });
});
