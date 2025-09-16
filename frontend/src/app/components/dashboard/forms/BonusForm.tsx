'use client';

import { useQuery } from '@tanstack/react-query';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TextField, SelectField } from '../../ui/FormField';
import type { BonusFormValues } from '../BonusManager';
import { fetchBonusOptions } from '@/lib/api/admin';
import type { ApiError } from '@/lib/api/client';
import { type BonusOptionsResponse } from '@shared/types';

export interface BonusFormProps {
  register: UseFormRegister<BonusFormValues>;
  errors: FieldErrors<BonusFormValues>;
  defaults?: Partial<BonusFormValues>;
  statusLabel?: string;
}

export default function BonusForm({
  register,
  errors,
  defaults = {},
  statusLabel = 'Status',
}: BonusFormProps) {
  const { data: options, error } = useQuery<BonusOptionsResponse, ApiError>({
    queryKey: ['admin-bonus-options'],
    queryFn: ({ signal }) => fetchBonusOptions({ signal }),
  });

  if (error) {
    return (
      <p className="text-xs text-danger-red">Failed to load bonus options</p>
    );
  }

  if (!options) return null;

  return (
    <>
      <TextField
        id="bonus-name"
        label="Promotion Name"
        placeholder="Enter promotion name..."
        name="name"
        register={register}
        errors={errors}
        defaultValue={defaults.name}
      />

      <SelectField
        id="bonus-type"
        label="Promotion Type"
        name="type"
        register={register}
        errors={errors}
        options={options.types}
        defaultValue={defaults.type}
      />

      <div>
        <label
          htmlFor="bonus-description"
          className="block text-sm font-semibold mb-2"
        >
          Description
        </label>
        <textarea
          id="bonus-description"
          rows={3}
          placeholder="Enter promotion description..."
          className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none resize-none"
          defaultValue={defaults.description}
          {...register('description')}
        />
        {errors.description?.message && (
          <p className="mt-1 text-xs text-danger-red" role="alert">
            {String(errors.description.message)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="bonus-percent"
          label="Bonus Amount (%)"
          type="number"
          placeholder="0"
          name="bonusPercent"
          register={register}
          errors={errors}
          defaultValue={defaults.bonusPercent}
          registerOptions={{ valueAsNumber: true }}
        />
        <TextField
          id="max-bonus-usd"
          label="Max $"
          type="number"
          placeholder="0"
          name="maxBonusUsd"
          register={register}
          errors={errors}
          defaultValue={defaults.maxBonusUsd}
          registerOptions={{ valueAsNumber: true }}
        />
      </div>

      <TextField
        id="expiry-date"
        label="Expiry Date"
        type="date"
        name="expiryDate"
        register={register}
        errors={errors}
        defaultValue={defaults.expiryDate}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          id="eligibility"
          label="Player Eligibility"
          name="eligibility"
          register={register}
          errors={errors}
          options={options.eligibilities}
          defaultValue={defaults.eligibility}
        />

        <SelectField
          id="status"
          label={statusLabel}
          name="status"
          register={register}
          errors={errors}
          options={options.statuses}
          defaultValue={defaults.status}
        />
      </div>
    </>
  );
}
