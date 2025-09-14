'use client';

import { useState } from 'react';
import BankTransferModal from '../components/wallet/BankTransferModal';
import Button from '../components/ui/Button';
import InlineError from '../components/ui/InlineError';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { useWalletStatus, useIbanDetails } from '@/hooks/wallet';

export default function WalletPage() {
  const [mode, setMode] = useState<'deposit' | 'withdraw' | null>(null);
  const { data: status } = useWalletStatus();
  const {
    data: ibanDetails,
    isLoading: ibanLoading,
    error: ibanError,
  } = useIbanDetails();

  return (
    <>
      <main className="p-4 space-y-4">
        <div className="flex gap-4">
          <Button onClick={() => setMode('deposit')}>Deposit</Button>
          <Button onClick={() => setMode('withdraw')}>Withdraw</Button>
        </div>

        {mode &&
          status &&
          (mode === 'withdraw' ? (
            ibanLoading ? (
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                aria-label="Loading bank details"
              />
            ) : ibanError ? (
              <InlineError message="Failed to load bank details" />
            ) : ibanDetails ? (
              <BankTransferModal
                mode="withdraw"
                onClose={() => setMode(null)}
                currency={status.currency}
                availableBalance={status.realBalance}
                bankDetails={{
                  bankName: ibanDetails.bankName,
                  accountName: ibanDetails.holder,
                  bankAddress: ibanDetails.bankAddress,
                  maskedAccountNumber: ibanDetails.ibanMasked,
                }}
              />
            ) : (
              <InlineError message="No bank details available" />
            )
          ) : (
            <BankTransferModal
              mode="deposit"
              onClose={() => setMode(null)}
              currency={status.currency}
            />
          ))}
      </main>
    </>
  );
}
