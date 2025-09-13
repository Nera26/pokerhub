'use client';

import { useState } from 'react';
import BankTransferModal from '../components/wallet/BankTransferModal';
import Button from '../components/ui/Button';
import { useWalletStatus } from '@/hooks/wallet';

export default function WalletPage() {
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);
  const { data: status } = useWalletStatus();

  return (
    <>
      <main className="p-4 space-y-4">
        <div className="flex gap-4">
          <Button onClick={() => setMode('deposit')}>Deposit</Button>
          <Button onClick={() => setMode('withdraw')}>Withdraw</Button>
        </div>

        {mode && status && (
          <BankTransferModal
            mode={mode}
            onClose={() => setMode(null)}
            currency={status.currency}
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
        )}
      </main>
    </>
  );
}
