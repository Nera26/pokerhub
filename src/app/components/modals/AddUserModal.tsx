'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faUpload,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type UserStatus = 'Active' | 'Frozen' | 'Banned';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (p: {
    username: string;
    email: string;
    password: string;
    balance: number;
    status: UserStatus;
    avatar?: string;
  }) => void;
};

export default function AddUserModal({ isOpen, onClose, onAdd }: Props) {
  const schema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
    balance: z.number().nonnegative('Balance must be at least 0'),
    status: z.enum(['Active', 'Frozen', 'Banned']),
    avatar: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      balance: 0,
      status: 'Active',
      avatar:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
    },
  });

  const avatar = watch('avatar') ?? '';
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = (data: FormData) => {
    onAdd(data);
    reset();
    onClose();
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setValue('avatar', String(r.result));
    r.readAsDataURL(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-0 border-b border-dark pb-4 mb-4">
        <h3 className="text-xl font-bold">Add New User</h3>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Input
          id="username"
          label="Username"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          id="email"
          type="email"
          label="Email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="password"
          type="password"
          label="Password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          id="balance"
          type="number"
          step="0.01"
          placeholder="0.00"
          label="Starting Balance"
          error={errors.balance?.message}
          {...register('balance', { valueAsNumber: true })}
        />

        <div>
          <label htmlFor="status" className="block text-sm font-semibold mb-2">
            Status
          </label>
          <select
            id="status"
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow outline-none"
            {...register('status')}
          >
            <option>Active</option>
            <option>Frozen</option>
            <option>Banned</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-xs text-danger-red">
              {errors.status.message}
            </p>
          )}
        </div>

        {/* Avatar (preview + upload) */}
        <div>
          <label htmlFor="avatar" className="block text-sm font-semibold mb-2">
            Avatar
          </label>
          <div className="flex items-center gap-3">
            <Image
              src={avatar}
              alt="Avatar preview"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full border border-dark object-cover"
            />
            <input type="hidden" {...register('avatar')} />
            <input
              id="avatar"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-card-bg hover:bg-hover-bg border border-dark px-3 py-2 rounded-xl text-sm font-semibold"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              Upload
            </button>
          </div>
          {errors.avatar && (
            <p className="mt-1 text-xs text-danger-red">
              {errors.avatar.message}
            </p>
          )}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSubmit(onSubmit)}
          className="flex-1 bg-accent-blue hover:bg-blue-600 px-4 py-3 rounded-xl font-semibold transition hover:brightness-110"
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
          Create User
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
