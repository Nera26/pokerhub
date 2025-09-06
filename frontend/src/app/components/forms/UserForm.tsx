'use client';

import { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required').optional(),
  status: z.enum(['Active', 'Frozen', 'Banned']),
  avatar: z.string().optional(),
  role: z.enum(['Player', 'Admin']).optional(),
  country: z.string().optional(),
});

export type UserFormValues = z.infer<typeof schema>;

type Props = {
  defaultValues?: Partial<UserFormValues>;
  submitLabel: ReactNode;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
  showPassword?: boolean;
  showAvatar?: boolean;
  showRole?: boolean;
  showCountry?: boolean;
  submitClassName?: string;
};

export default function UserForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  showPassword,
  showAvatar,
  showRole,
  showCountry,
  submitClassName,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const avatar = watch('avatar') ?? '';
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setValue('avatar', String(r.result));
    r.readAsDataURL(file);
  };

  const submit = handleSubmit((data) => {
    onSubmit(data);
    reset();
  });

  return (
    <div className="p-6 space-y-4">
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

      {showPassword && (
        <Input
          id="password"
          type="password"
          label="Password"
          error={errors.password?.message}
          {...register('password')}
        />
      )}

      {showRole && (
        <div>
          <label htmlFor="role" className="block text-sm font-semibold mb-2">
            Role
          </label>
          <select
            id="role"
            className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow outline-none"
            {...register('role')}
          >
            <option>Player</option>
            <option>Admin</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-danger-red">{errors.role.message}</p>
          )}
        </div>
      )}

      {showCountry && (
        <div>
          <label htmlFor="country" className="block text-sm font-semibold mb-2">
            Country
          </label>
          <Input
            id="country"
            label=""
            error={errors.country?.message}
            {...register('country')}
          />
        </div>
      )}

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
          <p className="mt-1 text-xs text-danger-red">{errors.status.message}</p>
        )}
      </div>

      {showAvatar && (
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
            <p className="mt-1 text-xs text-danger-red">{errors.avatar.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={submit}
          className={`flex-1 px-4 py-3 rounded-xl font-semibold transition ${submitClassName ?? 'bg-accent-green hover:bg-green-600'}`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

