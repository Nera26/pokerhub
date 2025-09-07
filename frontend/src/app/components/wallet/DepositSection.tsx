'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Tooltip from '../ui/Tooltip';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { useIban } from '@/hooks/wallet';

export interface DepositSectionProps {
  /** Called when user clicks close icon */
  onClose: () => void;
  /** Called when user confirms they have sent the deposit */
  onConfirm: () => void;
}

export default function DepositSection({
  onClose,
  onConfirm,
}: DepositSectionProps) {
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

  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<number | null>(null);
  const { data, isLoading, error } = useIban();

  useEffect(() => {
    // start countdown
    timerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!data?.iban) {
      alert('Failed to copy account number');
      return;
    }
    try {
      await navigator.clipboard.writeText(data.iban);
      alert('Account number copied to clipboard');
    } catch {
      alert('Failed to copy account number');
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
          <span className="font-semibold">Bank Name:</span> Trade &amp; Trust
          Bank
        </p>
        <p>
          <span className="font-semibold">Account Name:</span> PokerHub LLC
        </p>
        <p>
          <span className="font-semibold">Bank Address:</span> Bayanzurkh
          District, Ulaanbaatar
        </p>
        <p className="flex items-center">
          <span className="font-semibold">Account Number:</span>
          {isLoading ? (
            <span className="ml-2">Loading IBAN...</span>
          ) : error ? (
            <span className="ml-2 text-danger-red">{error.message}</span>
          ) : (
            <Tooltip text="Click to copy">
              <span
                onClick={handleCopy}
                className="ml-2 font-medium cursor-pointer"
              >
                {data?.masked}
              </span>
            </Tooltip>
          )}
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
