'use client';

import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../ui/Button';
import AmountInput from './AmountInput';

export interface BankTransferFormProps {
  currency: string;
  submitLabel: string;
  amountInputId: string;
  onSubmit: (payload: {
    amount: number;
    deviceId: string;
    currency: string;
  }) => void | Promise<void>;
  maxAmount?: number;
  children?: ReactNode;
}

export default function BankTransferForm({
  currency,
  submitLabel,
  amountInputId,
  onSubmit,
  maxAmount,
  children,
}: BankTransferFormProps) {
  const schema = z.object({
    amount: z
      .string()
      .refine(
        (val) => {
          const num = Number(val);
          return val !== '' && !Number.isNaN(num) && num > 0;
        },
        { message: 'Enter a valid amount' },
      )
      .refine(
        (val) =>
          maxAmount === undefined ? true : Number(val) <= maxAmount,
        { message: 'Insufficient funds' },
      ),
  });
  type Form = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '' },
    mode: 'onChange',
  });

  const getDeviceId = () => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    return id;
  };

  const submit = handleSubmit((data) =>
    onSubmit({
      amount: Number(data.amount),
      deviceId: getDeviceId(),
      currency,
    }),
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <AmountInput
        id={amountInputId}
        label={`Enter Amount (${currency})`}
        error={errors.amount?.message}
        {...register('amount')}
      />
      {children}
      <Button
        type="submit"
        variant="primary"
        className="w-full uppercase py-3"
        disabled={!isValid}
      >
        {submitLabel}
      </Button>
    </form>
  );
}

