import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from '../page';
import {
  useWalletStatus,
  useIbanDetails,
  useBankTransfer,
  useWithdraw,
} from '@/hooks/wallet';

jest.mock('@/hooks/wallet', () => ({
  useWalletStatus: jest.fn(),
  useIbanDetails: jest.fn(),
  useBankTransfer: jest.fn(() => ({
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    error: null,
  })),
  useWithdraw: jest.fn(() => ({
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    error: null,
  })),
}));

const mockStatus = {
  data: {
    realBalance: 100,
    creditBalance: 0,
    kycVerified: true,
    currency: 'EUR',
  },
};

beforeEach(() => {
  (useWalletStatus as jest.Mock).mockReturnValue(mockStatus);
  (useIbanDetails as jest.Mock).mockReset();
});

test('shows bank details when iban details resolve', async () => {
  (useIbanDetails as jest.Mock).mockReturnValue({
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
  (useIbanDetails as jest.Mock).mockReturnValue({
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

test('shows error state when iban details fail', async () => {
  (useIbanDetails as jest.Mock).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: new Error('fail'),
  });

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /failed to load bank details/i,
  );
});
