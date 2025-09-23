import {
  mockUseIbanDetails,
  mockUseWalletStatus,
  resetWalletMocks,
} from './walletTestUtils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletFeature from '@/features/wallet';

describe('Wallet feature page', () => {
  beforeEach(() => {
    resetWalletMocks();
  });

  test('shows bank details in withdraw modal when iban details resolve', async () => {
    mockUseIbanDetails.mockReturnValue({
      data: {
        ibanMasked: '***123',
        ibanFull: 'DE001',
        holder: 'John Doe',
        instructions: '',
        history: [],
        lastUpdatedBy: 'admin',
        lastUpdatedAt: '2024-01-01T00:00:00Z',
        bankName: 'Test Bank',
        bankAddress: '123 Street',
      },
      isLoading: false,
      error: null,
    });

    render(<WalletFeature />);
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const bankNameRow = await screen.findByText(/Bank Name:/i);
    expect(bankNameRow.closest('p')).toHaveTextContent('Test Bank');
    const accountNumberRow = screen.getByText(/Account Number:/i);
    expect(accountNumberRow.closest('p')).toHaveTextContent('***123');
  });

  test('does not open withdraw modal when iban details are unavailable', async () => {
    mockUseIbanDetails.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<WalletFeature />);
    await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('shows loading state while wallet status is fetched', () => {
    mockUseWalletStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<WalletFeature />);

    expect(screen.getByText(/loading wallet/i)).toBeInTheDocument();
  });
});
