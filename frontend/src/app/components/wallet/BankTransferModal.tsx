'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import Tooltip from '../ui/Tooltip';
import Button from '../ui/Button';
import BankTransferForm from './BankTransferForm';
import { BankTransferDepositResponse } from '@shared/wallet.schema';

interface BaseProps {
  mode: 'deposit' | 'withdraw';
  onClose: () => void;
  currency: string;
  onSubmit: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => void | Promise<BankTransferDepositResponse | void>;
}

interface DepositProps extends BaseProps {
  mode: 'deposit';
}

interface WithdrawProps extends BaseProps {
  mode: 'withdraw';
  availableBalance: number;
  bankDetails: {
    bankName: string;
    accountName: string;
    bankAddress: string;
    maskedAccountNumber: string;
  };
}

export type BankTransferModalProps = DepositProps | WithdrawProps;

export default function BankTransferModal(props: BankTransferModalProps) {
  const { mode, onClose, currency, onSubmit } = props;
  const [details, setDetails] = useState<BankTransferDepositResponse | null>(
    null,
  );

  const handleSubmit = async (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => {
    const res = await onSubmit(payload);
    if (mode === 'deposit') {
      setDetails(res as BankTransferDepositResponse);
    }
  };

  const handleCopy = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.bank.accountNumber);
    } catch {
      // ignore
    }
  };

  if (mode === 'deposit' && details) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Bank Transfer Instructions
        </h2>
        <div className="bg-primary-bg rounded-xl p-4 space-y-1 text-text-secondary text-sm">
          <p>
            <span className="font-semibold">Bank Name:</span>{' '}
            {details.bank.bankName}
          </p>
          <p className="flex items-center">
            <span className="font-semibold">Account Number:</span>
            <Tooltip text="Click to copy">
              <span
                onClick={handleCopy}
                className="ml-2 font-medium cursor-pointer"
              >
                {details.bank.accountNumber}
              </span>
            </Tooltip>
          </p>
          <p>
            <span className="font-semibold">Routing Code:</span>{' '}
            {details.bank.routingCode}
          </p>
          <p>
            <span className="font-semibold">Reference:</span>{' '}
            {details.reference}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="w-full uppercase py-3"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div
      className={
        mode === 'withdraw' ? 'max-h-[90vh] overflow-y-auto' : 'space-y-4'
      }
    >
      {mode === 'withdraw' ? (
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
      ) : (
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Deposit via Bank Transfer
        </h2>
      )}

      <div className={mode === 'withdraw' ? 'mb-4' : ''}>
        <BankTransferForm
          currency={currency}
          submitLabel={mode === 'deposit' ? 'Get Instructions' : 'Withdraw'}
          amountInputId={
            mode === 'deposit' ? 'deposit-amount' : 'withdraw-amount'
          }
          onSubmit={handleSubmit}
          maxAmount={mode === 'withdraw' ? props.availableBalance : undefined}
        >
          {mode === 'withdraw' && (
            <p className="text-xs text-text-secondary mt-1">
              Available: {props.availableBalance.toFixed(2)} {currency}
            </p>
          )}
        </BankTransferForm>
      </div>

      {mode === 'withdraw' && props.bankDetails && (
        <div className="mb-6 bg-primary-bg rounded-xl p-4">
          <p className="text-text-secondary mb-1">
            <span className="font-semibold">Bank Name:</span>{' '}
            {props.bankDetails.bankName}
          </p>
          <p className="text-text-secondary mb-1">
            <span className="font-semibold">Account Name:</span>{' '}
            {props.bankDetails.accountName}
          </p>
          <p className="text-text-secondary mb-1">
            <span className="font-semibold">Bank Address:</span>{' '}
            {props.bankDetails.bankAddress}
          </p>
          <p className="text-text-secondary">
            <span className="font-semibold">Account Number:</span>{' '}
            {props.bankDetails.maskedAccountNumber}
          </p>
        </div>
      )}
    </div>
  );
}
