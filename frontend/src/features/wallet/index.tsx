'use client';

import { useState } from 'react';
import WalletSummary from '@/app/components/wallet/WalletSummary';
import BankTransferModal from '@/app/components/wallet/BankTransferModal';
import Modal from '@/app/components/ui/Modal';
import { useWalletStatus, useIban } from '@/hooks/wallet';

export const dynamic = 'force-dynamic';

export default function WalletPage() {
  const { data: status } = useWalletStatus();
  const { data: iban } = useIban();
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);

  if (!status) {
    return <p>Loading wallet...</p>;
  }

  const bankDetails = iban
    ? {
        bankName: 'Your Bank',
        accountName: iban.holder,
        bankAddress: '',
        maskedAccountNumber: iban.masked,
      }
    : undefined;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <WalletSummary
        realBalance={status.realBalance}
        creditBalance={status.creditBalance}
        kycVerified={status.kycVerified}
        currency={status.currency}
        onDeposit={() => setMode('deposit')}
        onWithdraw={() => setMode('withdraw')}
      />

      <Modal isOpen={mode === 'deposit'} onClose={() => setMode(null)}>
        {mode === 'deposit' && (
          <BankTransferModal
            mode="deposit"
            currency={status.currency}
            onClose={() => setMode(null)}
          />
        )}
      </Modal>

      <Modal isOpen={mode === 'withdraw'} onClose={() => setMode(null)}>
        {mode === 'withdraw' && bankDetails && (
          <BankTransferModal
            mode="withdraw"
            currency={status.currency}
            availableBalance={status.realBalance}
            bankDetails={bankDetails}
            onClose={() => setMode(null)}
          />
        )}
      </Modal>
    </div>
  );
}
