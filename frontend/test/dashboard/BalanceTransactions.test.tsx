import { render, screen } from '@testing-library/react';
import BalanceTransactions from '@/app/components/dashboard/BalanceTransactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

describe('BalanceTransactions component states', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    (useQuery as jest.Mock).mockReset();
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
});
