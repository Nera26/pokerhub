'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import { BankTransferDepositResponse } from '@shared/types';
import Tooltip from '../ui/Tooltip';
import AmountInput from './AmountInput';

export interface DepositModalContentProps {
  onClose: () => void;
  onInitiate: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => Promise<BankTransferDepositResponse>;
}

export default function DepositModalContent({
  onClose,
  onInitiate,
}: DepositModalContentProps) {
  const depositSchema = z.object({
    amount: z
      .string()
      .refine(
        (val) => {
          const num = Number(val);
          return val !== '' && !Number.isNaN(num) && num > 0;
        },
        { message: 'Enter a valid amount' },
      ),
  });
  type DepositForm = z.infer<typeof depositSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: '' },
    mode: 'onChange',
  });

  const [details, setDetails] = useState<BankTransferDepositResponse | null>(null);

  const getDeviceId = () => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    return id;
  };

  const onSubmit = handleSubmit(async (data) => {
    const res = await onInitiate({
      amount: Number(data.amount),
      deviceId: getDeviceId(),
      currency: 'USD',
    });
    setDetails(res);
  });

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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
        Deposit via Bank Transfer
      </h2>
      <AmountInput
        id="deposit-amount"
        label="Enter Amount (USD)"
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Button
        type="submit"
        variant="primary"
        className="w-full uppercase py-3"
      >
        Get Instructions
      </Button>
    </form>
  );
}

