'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'Frozen' | 'Banned';
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updated: User) => void;
};

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['Player', 'Admin']),
  country: z.string().optional(),
  status: z.enum(['Active', 'Frozen', 'Banned']),
});

type FormData = z.infer<typeof schema>;

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  onSave,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: 'Player',
      country: '',
      status: user.status,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: user.name,
        email: user.email,
        role: 'Player',
        country: '',
        status: user.status,
      });
    }
  }, [isOpen, user, reset]);

  const submit = handleSubmit(({ name, email, status }) => {
    onSave({ ...user, name, email, balance: user.balance, status });
    onClose();
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark px-6 py-4">
        <h3 className="text-xl font-bold">
          Edit User - {user?.name ?? 'Player'}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 grid place-items-center rounded-xl text-text-secondary hover:bg-hover-bg"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Form */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm mb-2">Username</label>
          <input
            {...register('name')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* purely visual like the HTML demo */}
        <div>
          <label className="block text-sm mb-2">Role</label>
          <select
            {...register('role')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          >
            <option>Player</option>
            <option>Admin</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Country</label>
          <input
            {...register('country')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          />
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">
              {errors.country.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Status</label>
          <select
            {...register('status')}
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm"
          >
            <option>Active</option>
            <option>Frozen</option>
            <option>Banned</option>
          </select>
          {errors.status && (
            <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={submit}
            className="flex-1 bg-accent-green hover:bg-green-600 px-4 py-3 rounded-xl font-semibold transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
