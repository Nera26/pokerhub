/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WalletPage from '..';

const mockUseWalletStatus = jest.fn();
const mockUseIbanDetails = jest.fn();
const mockUseBankTransfer = jest.fn();
const mockUseWithdraw = jest.fn();

jest.mock('@/hooks/wallet', () => ({
  useWalletStatus: (...args: any[]) => mockUseWalletStatus(...args),
  useIbanDetails: (...args: any[]) => mockUseIbanDetails(...args),
  useBankTransfer: (...args: any[]) => mockUseBankTransfer(...args),
  useWithdraw: (...args: any[]) => mockUseWithdraw(...args),
}));

beforeEach(() => {
  mockUseBankTransfer.mockReturnValue({
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    error: null,
  });
  mockUseWithdraw.mockReturnValue({
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    error: null,
  });
  mockUseWalletStatus.mockReturnValue({
    data: {
      realBalance: 100,
      creditBalance: 0,
      kycVerified: true,
      currency: 'EUR',
    },
  });
});

it('renders bank details when iban details resolve', async () => {
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
  });

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(await screen.findByText('Test Bank')).toBeInTheDocument();
  expect(screen.getByText('***123')).toBeInTheDocument();
});

it('hides withdraw modal when iban details fail', async () => {
  mockUseIbanDetails.mockReturnValue({
    data: undefined,
    error: new Error('fail'),
  });

  render(<WalletPage />);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  expect(screen.queryByText('Withdraw Funds')).not.toBeInTheDocument();
});
