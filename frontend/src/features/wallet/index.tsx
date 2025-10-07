'use client';

import { useCallback, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import WalletSummary from '@/components/wallet/wallet-summary';
import Modal from '@/components/ui/modal';
import { useWalletStatus, useIbanDetails } from '@/hooks/wallet';

export const dynamic = 'force-dynamic';

const BankTransferModal = nextDynamic(
  () => import('@/components/wallet/bank-transfer-modal'),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-center text-text-secondary">Loading transfer form…</div>
    ),
  },
) as unknown as typeof import('@/components/wallet/bank-transfer-modal').default;

export default function WalletPage() {
  const { data: status } = useWalletStatus();
  const { data: ibanDetails } = useIbanDetails();
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);

  if (!status) {
    return <p>Loading wallet...</p>;
  }

  const bankDetails = useMemo(
    () =>
      ibanDetails
        ? {
            bankName: ibanDetails.bankName,
            accountName: ibanDetails.holder,
            bankAddress: ibanDetails.bankAddress,
            maskedAccountNumber: ibanDetails.ibanMasked,
          }
        : undefined,
    [ibanDetails],
  );

  const handleClose = useCallback(() => setMode(null), []);
  const handleDeposit = useCallback(() => setMode('deposit'), []);
  const handleWithdraw = useCallback(() => {
    if (bankDetails) {
      setMode('withdraw');
    }
  }, [bankDetails]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <WalletSummary
        realBalance={status.realBalance}
        creditBalance={status.creditBalance}
        kycVerified={status.kycVerified}
        currency={status.currency}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />

      <Modal isOpen={mode === 'deposit'} onClose={handleClose}>
        {mode === 'deposit' && (
          <BankTransferModal
            mode="deposit"
            currency={status.currency}
            onClose={handleClose}
          />
        )}
      </Modal>

      <Modal isOpen={mode === 'withdraw'} onClose={handleClose}>
        {mode === 'withdraw' && bankDetails && (
          <BankTransferModal
            mode="withdraw"
            currency={status.currency}
            availableBalance={status.realBalance}
            bankDetails={bankDetails}
            onClose={handleClose}
          />
        )}
      </Modal>
    </div>
  );
}
