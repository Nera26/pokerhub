'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import BankTransferForm from './BankTransferForm';

export interface WithdrawModalContentProps {
  /** Maximum available real balance */
  availableBalance: number;
  /** Bank account details */
  bankAccountNumber: string;
  accountTier: string;
  accountHolder: string;
  /** Called to close the modal */
  onClose: () => void;
  /** Called when user confirms withdrawal */
  onConfirm: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => void;
  /** Currency code */
  currency: string;
}

export default function WithdrawModalContent({
  availableBalance,
  bankAccountNumber,
  accountTier,
  accountHolder,
  onClose,
  onConfirm,
  currency,
}: WithdrawModalContentProps) {
  const handleSubmit = (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => {
    onConfirm(payload);
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Withdraw Funds
        </h2>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-accent-yellow text-2xl"
          aria-label="Close withdraw modal"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <BankTransferForm
          currency={currency}
          submitLabel="Withdraw"
          amountInputId="withdraw-amount"
          onSubmit={handleSubmit}
          maxAmount={availableBalance}
        >
          <p className="text-xs text-text-secondary mt-1">
            Available: {availableBalance.toFixed(2)} {currency}
          </p>
        </BankTransferForm>
      </div>

      {/* Bank Account Info */}
      <div className="mb-6 bg-primary-bg rounded-xl p-4">
        <p className="text-text-secondary mb-1">
          <span className="font-semibold">Bank Account Number:</span>{' '}
          {bankAccountNumber}
        </p>
        <p className="text-text-secondary mb-1">
          <span className="font-semibold">Account Tier:</span> {accountTier}
        </p>
        <p className="text-text-secondary">
          <span className="font-semibold">Account Holder:</span> {accountHolder}
        </p>
      </div>
    </div>
  );
}

