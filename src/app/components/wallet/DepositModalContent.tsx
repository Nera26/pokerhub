'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Tooltip from '../ui/Tooltip';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';

export interface DepositModalContentProps {
  /** Called when the modal close icon or backdrop is clicked */
  onClose: () => void;
  /** Called when user confirms they have sent the deposit */
  onConfirm: () => void;
  /** Bank name (displayed in instructions) */
  bankName?: string;
  /** Account name */
  accountName?: string;
  /** Bank address */
  bankAddress?: string;
  /** Account number (clickable to copy) */
  accountNumber?: string;
  /** Initial countdown seconds before enabling confirm button */
  countdownStart?: number;
}

export default function DepositModalContent({
  onClose,
  onConfirm,
  bankName = 'Trade & Trust Bank',
  accountName = 'PokerHub LLC',
  bankAddress = 'Bayanzurkh District, Ulaanbaatar',
  accountNumber = '1234 5678 9101 1121',
  countdownStart = 10,
}: DepositModalContentProps) {
  const depositSchema = z.object({
    confirm: z
      .boolean()
      .refine((v) => v, { message: 'Please confirm the deposit' }),
  });
  type DepositForm = z.infer<typeof depositSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: { confirm: false },
  });

  const [countdown, setCountdown] = useState(countdownStart);

  useEffect(() => {
    setCountdown(countdownStart);
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownStart]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      // Optionally show a toast here
    } catch {
      // Fallback or error handling
    }
  };

  const onSubmit = handleSubmit(() => onConfirm());

  return (
    <form
      onSubmit={onSubmit}
      className="max-h-[90vh] overflow-y-auto"
      noValidate
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
          Deposit via Bank Transfer
        </h2>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-accent-yellow text-2xl"
          aria-label="Close deposit modal"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-primary-bg rounded-xl p-4 mb-6 space-y-1 text-text-secondary text-sm">
        <p>
          <span className="font-semibold">Bank Name:</span> {bankName}
        </p>
        <p>
          <span className="font-semibold">Account Name:</span> {accountName}
        </p>
        <p>
          <span className="font-semibold">Bank Address:</span> {bankAddress}
        </p>
        <p className="flex items-center">
          <span className="font-semibold">Account Number:</span>
          <Tooltip text="Click to copy">
            <span
              onClick={handleCopy}
              className="ml-2 font-medium cursor-pointer"
            >
              {accountNumber}
            </span>
          </Tooltip>
        </p>
        <p className="italic text-xs mt-2">
          After transfer, your balance will be updated within 1–3 minutes.
        </p>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" {...register('confirm')} />
          <span className="text-sm text-text-secondary">
            I confirm that I have sent the deposit
          </span>
        </label>
        {errors.confirm && (
          <p className="text-xs text-danger-red mt-1">
            {errors.confirm.message}
          </p>
        )}
      </div>

      {/* Confirm Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full uppercase py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={countdown > 0}
      >
        {countdown > 0 ? `Waiting ${countdown}s…` : "I've Sent the Deposit"}
      </Button>
    </form>
  );
}
