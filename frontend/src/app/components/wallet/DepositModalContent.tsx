'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { BankTransferDepositResponse } from '@shared/wallet.schema';
import Tooltip from '../ui/Tooltip';
import BankTransferForm from './BankTransferForm';

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
  const [details, setDetails] = useState<BankTransferDepositResponse | null>(null);

  const handleSubmit = async (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => {
    const res = await onInitiate(payload);
    setDetails(res);
  };

  const handleCopy = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.bank.accountNumber);
    } catch {
      // ignore
    }
  };

  if (details) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Bank Transfer Instructions
        </h2>
        <div className="bg-primary-bg rounded-xl p-4 space-y-1 text-text-secondary text-sm">
          <p>
            <span className="font-semibold">Bank Name:</span> {details.bank.bankName}
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
            <span className="font-semibold">Routing Code:</span> {details.bank.routingCode}
          </p>
          <p>
            <span className="font-semibold">Reference:</span> {details.reference}
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
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
        Deposit via Bank Transfer
      </h2>
      <BankTransferForm
        currency={currency}
        submitLabel="Get Instructions"
        amountInputId="deposit-amount"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

