'use client';

import BankTransferModal from './BankTransferModal';

export interface WithdrawModalContentProps {
  /** Maximum available real balance */
  availableBalance: number;
  /** Bank account details */
  bankName: string;
  accountName: string;
  bankAddress: string;
  maskedAccountNumber: string;
  /** Called to close the modal */
  onClose: () => void;
  /** Called when user confirms withdrawal */
  onConfirm: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => void | Promise<void>;
  /** Currency code */
  currency: string;
}

export default function WithdrawModalContent({
  availableBalance,
  bankName,
  accountName,
  bankAddress,
  maskedAccountNumber,
  onClose,
  onConfirm,
  currency,
}: WithdrawModalContentProps) {
  return (
    <BankTransferModal
      mode="withdraw"
      onClose={onClose}
      onSubmit={onConfirm}
      currency={currency}
      availableBalance={availableBalance}
      bankDetails={{
        bankName,
        accountName,
        bankAddress,
        maskedAccountNumber,
      }}
    />
  );
}
