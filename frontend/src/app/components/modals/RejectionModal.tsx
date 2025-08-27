'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../ui/Modal';

const schema = z.object({
  reason: z.string().trim().min(1, 'Reason is required'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
};

export default function RejectionModal({
  open,
  onClose,
  onConfirm,
  title = 'Rejection Reason',
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  const submit = handleSubmit((data) => {
    onConfirm(data.reason.trim());
    reset();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose}>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <textarea
        {...register('reason')}
        placeholder="Enter reason for rejection (required)"
        className="w-full bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm h-24 resize-none"
      />
      {errors.reason && (
        <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
      )}
      <div className="flex gap-3 mt-6">
        <button
          onClick={submit}
          className="flex-1 bg-danger-red hover:bg-red-600 py-2 rounded-2xl font-semibold"
        >
          Confirm Rejection
        </button>
        <button
          onClick={handleClose}
          className="flex-1 bg-hover-bg hover:bg-gray-600 py-2 rounded-2xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
