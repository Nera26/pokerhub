import { mockUseIbanDetails, resetWalletMocks } from './walletTestUtils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from '../page';

beforeEach(() => {
  resetWalletMocks();
});

test('shows bank details when iban details resolve', async () => {
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

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(await screen.findByText('Test Bank')).toBeInTheDocument();
  expect(screen.getByText('***123')).toBeInTheDocument();
});

test('shows empty state when iban details missing', async () => {
  mockUseIbanDetails.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  });

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /no bank details available/i,
  );
});

test('shows error state and hides withdraw modal when iban details fail', async () => {
  mockUseIbanDetails.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: new Error('fail'),
  });

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /failed to load bank details/i,
  );
  expect(screen.queryByText('Withdraw Funds')).not.toBeInTheDocument();
});
