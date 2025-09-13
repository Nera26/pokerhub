'use client';

import { useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchUserMeta } from '@/lib/api/admin';
import type { ApiError } from '@/lib/api/client';
import {
  UserRoleSchema,
  UserStatusSchema,
  type UserMetaResponse,
} from '@shared/types';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required').optional(),
  status: UserStatusSchema,
  avatar: z.string().optional(),
  role: UserRoleSchema.optional(),
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

  const {
    data: meta,
    isLoading,
    error,
  } = useQuery<UserMetaResponse, ApiError>({
    queryKey: ['admin-user-meta'],
    queryFn: ({ signal }) => fetchUserMeta({ signal }),
  });

  if (error) {
    return (
      <p className="p-6 text-xs text-danger-red">Failed to load user options</p>
    );
  }

  if (isLoading || !meta) {
    return <p className="p-6 text-sm">Loading...</p>;
  }

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
            {meta.roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-danger-red">
              {errors.role.message}
            </p>
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
          {meta.statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.status && (
          <p className="mt-1 text-xs text-danger-red">
            {errors.status.message}
          </p>
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
            <p className="mt-1 text-xs text-danger-red">
              {errors.avatar.message}
            </p>
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
