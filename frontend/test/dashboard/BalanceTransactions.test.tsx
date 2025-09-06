import { render, screen } from '@testing-library/react';
import BalanceTransactions from '@/app/components/dashboard/BalanceTransactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

describe('BalanceTransactions component states', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
  });

  it('shows spinner while loading deposits', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: true, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByLabelText('loading deposits')).toBeInTheDocument();
  });

  it('shows placeholder when no deposits', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByText('No pending deposits.')).toBeInTheDocument();
  });

  it('shows API error message', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: [], isLoading: false, error: { message: 'fail' } })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null })
      .mockReturnValueOnce({ data: [], isLoading: false, error: null });
    render(<BalanceTransactions />);
    expect(screen.getByRole('alert')).toHaveTextContent('fail');
  });
});
