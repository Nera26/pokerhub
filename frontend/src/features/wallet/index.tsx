'use client';

import { useState } from 'react';
import WalletSummary from '@/app/components/wallet/WalletSummary';
import BankTransferModal from '@/app/components/wallet/BankTransferModal';
import Modal from '@/app/components/ui/Modal';
import { useWalletStatus, useIbanDetails } from '@/hooks/wallet';

export const dynamic = 'force-dynamic';

export default function WalletPage() {
  const { data: status } = useWalletStatus();
  const { data: ibanDetails } = useIbanDetails();
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);

  if (!status) {
    return <p>Loading wallet...</p>;
  }

  const bankDetails = ibanDetails
    ? {
        bankName: ibanDetails.bankName,
        accountName: ibanDetails.holder,
        bankAddress: ibanDetails.bankAddress,
        maskedAccountNumber: ibanDetails.ibanMasked,
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
        onWithdraw={() => bankDetails && setMode('withdraw')}
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
