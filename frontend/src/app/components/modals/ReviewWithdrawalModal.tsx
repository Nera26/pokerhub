'use client';

import { useMemo } from 'react';
import Modal from '../ui/Modal';
import ModalHeader from './ModalHeader';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Withdrawal = {
  user: string;
  amount: string; // "$200.00"
  date: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  bankInfo?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  request: Withdrawal;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
};

const schema = z.object({
  comment: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function ReviewWithdrawalModal({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comment: '' },
    mode: 'onChange',
  });

  const amountFormatted = useMemo(() => {
    if (!request?.amount) return '$0.00';
    return request.amount.startsWith('$')
      ? request.amount
      : `$${request.amount}`;
  }, [request]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Review Withdrawal Request" onClose={onClose} />

      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <p>
            <strong>User:</strong> {request?.user}
          </p>
          <p>
            <strong>Amount:</strong> {amountFormatted}
          </p>
          <p>
            <strong>Request Date:</strong> {request?.date}
          </p>
          <p>
            <strong>Bank Info:</strong>{' '}
            {request?.bankInfo ?? 'N/A'}
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">Admin Comment</label>
          <textarea
            rows={3}
            {...register('comment')}
            placeholder="Enter reason or notes..."
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit(({ comment }) => onApprove(comment))}
            disabled={!isValid}
            className="flex-1 bg-accent-green hover:bg-green-600 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve
          </button>
          <button
            onClick={handleSubmit(({ comment }) => onReject(comment))}
            disabled={!isValid}
            className="flex-1 bg-danger-red hover:bg-red-600 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      </div>
    </Modal>
  );
}
