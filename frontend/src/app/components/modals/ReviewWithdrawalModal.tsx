'use client';

import { useMemo } from 'react';
import Modal from '../ui/Modal';
import ModalHeader from './ModalHeader';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmWithdrawal, rejectWithdrawal } from '@/lib/api/wallet';
import type { PendingWithdrawal } from '@shared/types';

type Props = {
  onClose: () => void;
  request: PendingWithdrawal;
};

const schema = z.object({
  comment: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function ReviewWithdrawalModal({ onClose, request }: Props) {
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comment: '' },
    mode: 'onChange',
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => confirmWithdrawal(request.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      onClose();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (comment: string) => rejectWithdrawal(request.id, comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      onClose();
    },
  });

  const amountFormatted = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: request.currency,
    }).format(request.amount);
  }, [request.amount, request.currency]);

  const bankInfo = useMemo(() => {
    return (
      request.bankInfo ??
      (`${request.bank} ${request.maskedAccount}`.trim() || 'N/A')
    );
  }, [request.bankInfo, request.bank, request.maskedAccount]);

  const error = (approveMutation.error || rejectMutation.error) as Error | null;
  const loading = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title="Review Withdrawal Request" onClose={onClose} />
      <div className="p-6 space-y-4">
        {error && (
          <p role="alert" className="text-danger-red">
            {error.message}
          </p>
        )}
        <div className="space-y-1">
          <p>
            <strong>User:</strong> {request.userId}
          </p>
          <p>
            <strong>Amount:</strong> {amountFormatted}
          </p>
          <p>
            <strong>Request Date:</strong>{' '}
            {new Date(request.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Bank Info:</strong> {bankInfo}
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
            onClick={handleSubmit(() => approveMutation.mutate())}
            disabled={!isValid || loading}
            className="flex-1 bg-accent-green hover:bg-green-600 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={handleSubmit(({ comment }) =>
              rejectMutation.mutate(comment),
            )}
            disabled={!isValid || loading}
            className="flex-1 bg-danger-red hover:bg-red-600 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
