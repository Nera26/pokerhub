'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import Input from '../ui/Input';
import Button from '../ui/Button';

export interface WithdrawSectionProps {
  /** Available real balance for withdrawal */
  availableBalance: number;
  /** Read-only bank account number */
  bankAccountNumber: string;
  /** Verified account tier */
  accountTier: string;
  /** Account holder name */
  accountHolder: string;
  /** Called to close the modal */
  onClose: () => void;
  /** Called when user confirms withdrawal */
  onConfirm: (amount: number) => void;
}

const withdrawSchema = (availableBalance: number) =>
  z.object({
    amount: z
      .string()
      .refine(
        (val) => {
          const num = Number(val);
          return val !== '' && !Number.isNaN(num) && num > 0;
        },
        { message: 'Enter a valid amount' },
      )
      .refine((val) => Number(val) <= availableBalance, {
        message: 'Insufficient funds',
      }),
  });

type WithdrawForm = z.infer<ReturnType<typeof withdrawSchema>>;

export default function WithdrawSection({
  availableBalance,
  bankAccountNumber,
  accountTier,
  accountHolder,
  onClose,
  onConfirm,
}: WithdrawSectionProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema(availableBalance)),
    defaultValues: { amount: '' },
    mode: 'onChange',
  });

  const submit = handleSubmit((data) => onConfirm(Number(data.amount)));

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Withdraw Funds
        </h2>
        <button
          onClick={onClose}
          aria-label="Close withdraw modal"
          title="Close withdraw modal"
          className="text-text-secondary hover:text-accent-yellow text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <Input
          id="withdraw-amount"
          label="Enter Amount (USD)"
          type="number"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <p className="text-xs text-text-secondary mt-1">
          Available: ${availableBalance.toFixed(2)}
        </p>
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

      {/* Confirm Withdrawal */}
      <Button
        variant="primary"
        className="w-full uppercase py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={submit}
        disabled={!isValid}
      >
        Withdraw
      </Button>
    </div>
  );
}
