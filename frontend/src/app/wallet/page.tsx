'use client';

import { useEffect, useState } from 'react';
import BankTransferModal from '../components/wallet/BankTransferModal';
import Button from '../components/ui/Button';
import ToastNotification from '../components/ui/ToastNotification';
import InlineError from '../components/ui/InlineError';
import useToasts from '@/hooks/useToasts';
import { useApiError } from '@/hooks/useApiError';
import { useBankTransfer, useWalletStatus, useWithdraw } from '@/hooks/wallet';

export default function WalletPage() {
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);
  const { data: status } = useWalletStatus();
  const bankTransfer = useBankTransfer();
  const withdraw = useWithdraw();
  const { toasts, pushToast } = useToasts();

  const activeMutation = mode === 'withdraw' ? withdraw : bankTransfer;
  const errorMessage = useApiError(activeMutation.error);

  useEffect(() => {
    if (bankTransfer.isSuccess)
      pushToast('Bank transfer initiated', { variant: 'success' });
  }, [bankTransfer.isSuccess, pushToast]);

  useEffect(() => {
    if (withdraw.isSuccess)
      pushToast('Withdrawal requested', { variant: 'success' });
  }, [withdraw.isSuccess, pushToast]);

  const handleSubmit = (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => {
    return mode === 'withdraw'
      ? withdraw.mutateAsync(payload)
      : bankTransfer.mutateAsync(payload);
  };

  return (
    <>
      <main className="p-4 space-y-4">
        <div className="flex gap-4">
          <Button onClick={() => setMode('deposit')}>Deposit</Button>
          <Button onClick={() => setMode('withdraw')}>Withdraw</Button>
        </div>

        {mode && status && (
          <div
            aria-busy={activeMutation.isPending}
            className={
              activeMutation.isPending ? 'pointer-events-none opacity-50' : ''
            }
          >
            <BankTransferModal
              mode={mode}
              onClose={() => setMode(null)}
              currency={status.currency}
              onSubmit={handleSubmit}
              {...(mode === 'withdraw'
                ? {
                    availableBalance: status.realBalance,
                    bankDetails: {
                      bankName: 'Your Bank',
                      accountName: 'John Doe',
                      bankAddress: '123 Street',
                      maskedAccountNumber: '****1234',
                    },
                  }
                : {})}
            />
            {errorMessage && <InlineError message={errorMessage} />}
          </div>
        )}
      </main>

      {toasts.map((t) => (
        <ToastNotification
          key={t.id}
          message={t.message}
          type={t.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={t.duration}
          onClose={() => {}}
        />
      ))}
    </>
  );
}
