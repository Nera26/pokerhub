'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../ui/Modal';
import ModalHeader from './ModalHeader';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentBalance: number;
  onSubmit: (amount: number, action: BalanceAction, notes: string) => void;
};

type BalanceAction = 'add' | 'remove' | 'freeze';

const schema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .gt(0, { message: 'Amount must be greater than 0' }),
  action: z.enum(['add', 'remove', 'freeze']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ManageBalanceModal({
  isOpen,
  onClose,
  userName,
  currentBalance,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, action: 'add', notes: '' },
  });

  const handleClose = () => {
    onClose();
    reset();
  };

  const submit = handleSubmit((data) => {
    onSubmit(data.amount, data.action, data.notes || '');
    handleClose();
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader
        title={`Manage Balance - ${userName || 'Player'}`}
        onClose={handleClose}
      />

      <div className="p-6 space-y-4">
        <div className="bg-primary-bg rounded-xl p-4 text-center">
          <p className="text-sm text-text-secondary mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-accent-yellow">
            ${currentBalance.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Action</label>
          <select
            {...register('action')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          >
            <option value="add">Add Balance</option>
            <option value="remove">Remove Balance</option>
            <option value="freeze">Freeze Funds</option>
          </select>
          {errors.action && (
            <p className="text-red-500 text-sm mt-1">{errors.action.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Notes (Optional)</label>
          <textarea
            rows={3}
            {...register('notes')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm resize-none"
            placeholder="Reason for balance change..."
          />
          {errors.notes && (
            <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={submit}
            className="flex-1 bg-accent-yellow hover:bg-yellow-500 text-black px-4 py-3 rounded-xl font-semibold transition"
          >
            Submit
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
