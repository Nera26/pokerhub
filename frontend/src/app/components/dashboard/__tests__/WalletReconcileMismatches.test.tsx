import { screen, fireEvent } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import WalletReconcileMismatches from '../WalletReconcileMismatches';
import { useWalletReconcileMismatches } from '@/hooks/wallet';

jest.mock('@/hooks/wallet', () => ({
  useWalletReconcileMismatches: jest.fn(),
}));

describe('WalletReconcileMismatches', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders mismatch count', () => {
    const refetch = jest.fn();
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: {
        mismatches: [
          { type: 'a', date: '2024-01-01', total: 10 },
          { type: 'b', date: '2024-01-02', total: 20 },
        ],
      },
      isLoading: false,
      error: null,
      refetch,
    });
    renderWithClient(<WalletReconcileMismatches />);
    expect(screen.getByText(/2 mismatches/i)).toBeInTheDocument();
  });

  it('handles empty state', () => {
    const refetch = jest.fn();
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: { mismatches: [] },
      isLoading: false,
      error: null,
      refetch,
    });
    renderWithClient(<WalletReconcileMismatches />);
    expect(screen.getByText(/no mismatches/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const refetch = jest.fn();
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('x'),
      refetch,
    });
    renderWithClient(<WalletReconcileMismatches />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /failed to load mismatches/i,
    );
  });

  it('refetches on actions', () => {
    const refetch = jest.fn();
    (useWalletReconcileMismatches as jest.Mock).mockReturnValue({
      data: { mismatches: [{ type: 'a', date: '2024-01-01', total: 10 }] },
      isLoading: false,
      error: null,
      refetch,
    });
    renderWithClient(<WalletReconcileMismatches />);
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refetch).toHaveBeenCalledTimes(2);
  });
});
