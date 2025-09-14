/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen } from '@testing-library/react';

import WalletPage from '..';
import {
  renderAndOpenWithdraw,
  expectBankDetailsShown,
  sampleIbanDetails,
} from './utils';

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
  mockUseIbanDetails.mockReturnValue({ data: sampleIbanDetails });

  await renderAndOpenWithdraw(<WalletPage />);
  await expectBankDetailsShown();
});

it('hides withdraw modal when iban details fail', async () => {
  mockUseIbanDetails.mockReturnValue({
    data: undefined,
    error: new Error('fail'),
  });

  await renderAndOpenWithdraw(<WalletPage />);

  expect(screen.queryByText('Withdraw Funds')).not.toBeInTheDocument();
});
