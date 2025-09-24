'use client';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { fetchTiers } from '@/lib/api/tiers';
import { computeTierProgress } from '@/lib/tierProgress';
import type { Tier, UserProfile } from '@shared/types';

const editProfileSchema = z.object({
  avatar: z.any().optional(),
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  bank: z.string().min(1, 'Bank account number is required'),
  bio: z.string().max(200, 'Bio must be under 200 characters'),
});

export type EditProfileData = z.infer<typeof editProfileSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (data: FormData) => void;
  isTierLoading?: boolean;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
  isTierLoading = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<File | null>(null);

  const {
    register,
    setValue,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      avatar: null,
      username: '',
      email: '',
      bank: '',
      bio: '',
    },
  });

  const avatarField = register('avatar');

  const {
    data: tiers = [],
    isLoading: tierQueryLoading,
    isError: tierError,
  } = useQuery<Tier[]>({
    queryKey: ['tiers'],
    queryFn: ({ signal }) => fetchTiers({ signal }),
    enabled: isOpen,
  });

  const progress =
    !tierError && tiers.length
      ? computeTierProgress(tiers, profile.experience)
      : null;
  const showTierProgress =
    Boolean(progress) && !isTierLoading && !tierQueryLoading;

  useEffect(() => {
    if (isOpen) {
      avatarRef.current = null;
      reset({
        avatar: null,
        username: profile.username,
        email: profile.email,
        bank: profile.bank,
        bio: profile.bio,
      });
    }
  }, [isOpen, reset, profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.type.startsWith('image/')) return;
    avatarRef.current = file;
    setValue('avatar', file, { shouldValidate: true });
  };

  const onSubmit = (data: EditProfileData) => {
    const formData = new FormData();
    if (avatarRef.current) {
      formData.append('avatar', avatarRef.current);
    }
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('bank', data.bank);
    formData.append('bio', data.bio);
    onSave(formData);
  };

  const avatarFile = watch('avatar');
  const bioValue = watch('bio') || '';
  const tierStatusMessage =
    isTierLoading || tierQueryLoading
      ? 'Loading tier progress...'
      : 'Tier data unavailable';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="p-6 border-b border-border-dark flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Profile</h2>
        <button
          onClick={onClose}
          aria-label="Close edit profile modal"
          className="text-text-secondary hover:text-danger-red focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
      </div>

      {/* Form */}
      <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Avatar & Username */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-subtext text-text-secondary">
              Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              {...avatarField}
              ref={(e) => {
                avatarField.ref(e);
                fileInputRef.current = e;
              }}
              onChange={handleAvatarChange}
            />
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <span className="text-text-secondary text-sm">
                {avatarFile ? (avatarFile as File).name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div>
            <Input
              id="username"
              label="Username"
              error={errors.username?.message}
              {...register('username')}
            />
          </div>
        </div>

        {/* Email & Bank */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              id="email"
              type="email"
              label="Email Address"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          <div>
            <Input
              id="bank"
              label="Bank Account Number"
              error={errors.bank?.message}
              {...register('bank')}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block mb-1 text-subtext text-text-secondary">
            Bio (200 characters max)
          </label>
          <textarea
            maxLength={200}
            {...register('bio')}
            className="w-full bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus-glow-yellow resize-none h-24"
          />
          <div className="text-right text-xs text-text-secondary mt-1">
            {bioValue.length}/200
          </div>
          {errors.bio && (
            <p className="text-xs text-danger-red mt-1">{errors.bio.message}</p>
          )}
        </div>

        {/* Tier & EXP */}
        <div>
          <label className="block mb-1 text-subtext text-text-secondary">
            Current Tier &amp; EXP
          </label>
          {showTierProgress && progress ? (
            <>
              <div className="flex items-center space-x-4">
                <span className="bg-accent-yellow text-primary-bg font-semibold py-1 px-3 rounded-full text-sm">
                  {progress.name}
                </span>
                <p className="text-text-secondary text-sm">
                  EXP: {progress.current.toLocaleString()} /{' '}
                  {progress.next.toLocaleString()}
                </p>
              </div>
              <div className="w-full bg-border-dark rounded-full h-3 mt-2 overflow-hidden">
                <div
                  className="h-full bg-accent-green"
                  data-testid="tier-progress-bar"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-text-secondary text-sm">{tierStatusMessage}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
