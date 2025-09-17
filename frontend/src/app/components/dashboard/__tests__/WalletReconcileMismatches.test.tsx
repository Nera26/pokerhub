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
          {
            account: 'player:1',
            balance: 1500,
            journal: 1200,
            delta: 300,
            date: '2024-01-01T00:00:00.000Z',
          },
          {
            account: 'house',
            balance: -1500,
            journal: -1200,
            delta: -300,
            date: '2024-01-02T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch,
    });
    renderWithClient(<WalletReconcileMismatches />);
    expect(screen.getByText(/2 mismatches/i)).toBeInTheDocument();
    expect(screen.getByText('player:1')).toBeInTheDocument();
    expect(screen.getByText(/Δ \$300/)).toBeInTheDocument();
    expect(
      screen.getByText(/Balance \$1,500 · Journal \$1,200/),
    ).toBeInTheDocument();
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
      data: {
        mismatches: [
          {
            account: 'player:1',
            balance: 1500,
            journal: 1200,
            delta: 300,
            date: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
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
