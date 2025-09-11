'use client';

import BankTransferModal from './BankTransferModal';
import { BankTransferDepositResponse } from '@shared/wallet.schema';

export interface DepositModalContentProps {
  onClose: () => void;
  onInitiate: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => Promise<BankTransferDepositResponse>;
  currency: string;
}

export default function DepositModalContent({
  onClose,
  onInitiate,
  currency,
}: DepositModalContentProps) {
  return (
    <BankTransferModal
      mode="deposit"
      onClose={onClose}
      onSubmit={onInitiate}
      currency={currency}
    />
  );
}
