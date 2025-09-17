import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import WalletReconcileMismatches from '../WalletReconcileMismatches';
import { useWalletReconcileMismatches } from '@/hooks/wallet';
import { markWalletMismatchAcknowledged } from '@/lib/api/wallet';

jest.mock('@/hooks/wallet', () => ({
  useWalletReconcileMismatches: jest.fn(),
}));

jest.mock('@/lib/api/wallet', () => ({
  markWalletMismatchAcknowledged: jest.fn(),
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

  it('acknowledges a mismatch and removes it from the list', async () => {
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
    (markWalletMismatchAcknowledged as jest.Mock).mockResolvedValue({
      account: 'player:1',
      acknowledgedBy: 'admin',
      acknowledgedAt: '2024-01-03T00:00:00.000Z',
    });

    renderWithClient(<WalletReconcileMismatches />);

    const [acknowledgeButton] = screen.getAllByRole('button', {
      name: /acknowledge/i,
    });
    fireEvent.click(acknowledgeButton);

    await waitFor(() =>
      expect(markWalletMismatchAcknowledged).toHaveBeenCalledWith('player:1'),
    );
    await waitFor(() =>
      expect(screen.queryByText('player:1')).not.toBeInTheDocument(),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an error if acknowledgement fails', async () => {
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
    (markWalletMismatchAcknowledged as jest.Mock).mockRejectedValue(
      new Error('network'),
    );

    renderWithClient(<WalletReconcileMismatches />);

    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));

    await waitFor(() =>
      expect(markWalletMismatchAcknowledged).toHaveBeenCalledWith('player:1'),
    );

    expect(screen.getByText('Failed to acknowledge mismatch.')).toBeVisible();
    expect(screen.getByText('player:1')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });
});
