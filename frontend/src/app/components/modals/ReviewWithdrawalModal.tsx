'use client';

import { useMemo } from 'react';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark px-6 py-4">
        <h3 className="text-xl font-bold">Review Withdrawal Request</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 grid place-items-center rounded-xl text-text-secondary hover:bg-hover-bg"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

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
            {request?.bankInfo ?? '****-****-****-1234'}
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
