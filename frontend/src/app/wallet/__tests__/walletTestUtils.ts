/* eslint-disable @typescript-eslint/no-explicit-any */
export const mockUseWalletStatus = jest.fn();
export const mockUseIbanDetails = jest.fn();
export const mockUseBankTransfer = jest.fn();
export const mockUseWithdraw = jest.fn();

jest.mock('@/hooks/wallet', () => ({
  useWalletStatus: (...args: any[]) => mockUseWalletStatus(...args),
  useIbanDetails: (...args: any[]) => mockUseIbanDetails(...args),
  useBankTransfer: (...args: any[]) => mockUseBankTransfer(...args),
  useWithdraw: (...args: any[]) => mockUseWithdraw(...args),
}));

export const defaultWalletStatus = {
  data: {
    realBalance: 100,
    creditBalance: 0,
    kycVerified: true,
    currency: 'EUR',
  },
};

export const defaultBankTransfer = {
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  error: null,
};

export const defaultWithdraw = {
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  error: null,
};

export function resetWalletMocks() {
  mockUseWalletStatus.mockReset();
  mockUseIbanDetails.mockReset();
  mockUseBankTransfer.mockReset();
  mockUseWithdraw.mockReset();

  mockUseWalletStatus.mockReturnValue(defaultWalletStatus);
  mockUseBankTransfer.mockReturnValue(defaultBankTransfer);
  mockUseWithdraw.mockReturnValue(defaultWithdraw);
}
