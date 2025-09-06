'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ConfirmModal from '../ui/ConfirmModal';

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
    <ConfirmModal
      isOpen={open}
      onClose={handleClose}
      onConfirm={submit}
      title={title}
      confirmText="Confirm Rejection"
    >
      <textarea
        {...register('reason')}
        placeholder="Enter reason for rejection (required)"
        className="w-full bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm h-24 resize-none"
      />
      {errors.reason && (
        <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
      )}
    </ConfirmModal>
  );
}
