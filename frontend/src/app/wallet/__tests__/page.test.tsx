import { screen } from '@testing-library/react';
import WalletPage from '../page';
import {
  useWalletStatus,
  useIbanDetails,
  useBankTransfer,
  useWithdraw,
} from '@/hooks/wallet';
import {
  renderAndOpenWithdraw,
  expectBankDetailsShown,
  sampleIbanDetails,
} from '../../../features/wallet/__tests__/utils';

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
    data: sampleIbanDetails,
    isLoading: false,
    error: null,
  });

  await renderAndOpenWithdraw(<WalletPage />);
  await expectBankDetailsShown();
});

test('shows empty state when iban details missing', async () => {
  (useIbanDetails as jest.Mock).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  });

  await renderAndOpenWithdraw(<WalletPage />);

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

  await renderAndOpenWithdraw(<WalletPage />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /failed to load bank details/i,
  );
});
