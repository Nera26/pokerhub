import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useBankTransfer, useWithdraw } from '@/hooks/wallet';
import {
  initiateBankTransfer,
  withdraw as withdrawApi,
} from '@/lib/api/wallet';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ playerId: 'u1' }),
}));

jest.mock('@/lib/api/wallet', () => ({
  initiateBankTransfer: jest.fn(),
  withdraw: jest.fn(),
}));

describe('wallet hooks', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient();
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiates bank transfer successfully', async () => {
    (initiateBankTransfer as jest.Mock).mockResolvedValue({
      reference: 'r1',
      bank: { bankName: 'b', accountNumber: 'a', routingCode: 'c' },
    });
    const { result } = renderHook(() => useBankTransfer(), { wrapper });
    await act(async () => {
      const res = await result.current.mutateAsync({
        amount: 10,
        deviceId: 'd1',
        currency: 'EUR',
      });
      expect(res).toEqual({
        reference: 'r1',
        bank: { bankName: 'b', accountNumber: 'a', routingCode: 'c' },
      });
    });
    expect(initiateBankTransfer).toHaveBeenCalledWith(
      'u1',
      10,
      'd1',
      'EUR',
      undefined,
    );
  });

  it('handles bank transfer errors', async () => {
    (initiateBankTransfer as jest.Mock).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useBankTransfer(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          amount: 10,
          deviceId: 'd1',
          currency: 'EUR',
        }),
      ).rejects.toThrow('fail');
    });
  });

  it('withdraws successfully', async () => {
    (withdrawApi as jest.Mock).mockResolvedValue({
      kycVerified: true,
      realBalance: 5,
      creditBalance: 0,
      currency: 'EUR',
    });
    const { result } = renderHook(() => useWithdraw(), { wrapper });
    await act(async () => {
      const res = await result.current.mutateAsync({
        amount: 5,
        deviceId: 'd1',
        currency: 'EUR',
      });
      expect(res).toEqual({
        kycVerified: true,
        realBalance: 5,
        creditBalance: 0,
        currency: 'EUR',
      });
    });
    expect(withdrawApi).toHaveBeenCalledWith('u1', 5, 'd1', 'EUR');
  });

  it('handles withdraw errors', async () => {
    (withdrawApi as jest.Mock).mockRejectedValue(new Error('oops'));
    const { result } = renderHook(() => useWithdraw(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          amount: 5,
          deviceId: 'd1',
          currency: 'EUR',
        }),
      ).rejects.toThrow('oops');
    });
  });
});
