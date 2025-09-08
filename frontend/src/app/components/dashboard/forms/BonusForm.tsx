'use client';

import { useQuery } from '@tanstack/react-query';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Input from '../../ui/Input';
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

  const typeLabels: Record<string, string> = {
    deposit: 'Deposit Match',
    rakeback: 'Rakeback',
    ticket: 'Tournament Tickets',
    rebate: 'Rebate',
    'first-deposit': 'First Deposit Only',
  };
  const eligibilityLabels: Record<string, string> = {
    all: 'All Players',
    new: 'New Players Only',
    vip: 'VIP Players Only',
    active: 'Active Players',
  };
  const statusLabels: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
  };

  return (
    <>
      <Input
        id="bonus-name"
        label="Promotion Name"
        placeholder="Enter promotion name..."
        error={errors.name?.message}
        defaultValue={defaults.name}
        {...register('name')}
      />

      <div>
        <label htmlFor="bonus-type" className="block text-sm font-semibold mb-2">
          Promotion Type
        </label>
        <select
          id="bonus-type"
          className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
          defaultValue={defaults.type}
          {...register('type')}
        >
          {options.types.map((t) => (
            <option key={t} value={t}>
              {typeLabels[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bonus-description" className="block text-sm font-semibold mb-2">
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
        {errors.description && (
          <p className="text-xs text-danger-red mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="bonus-percent"
          label="Bonus Amount (%)"
          type="number"
          placeholder="0"
          error={errors.bonusPercent?.message}
          defaultValue={defaults.bonusPercent}
          {...register('bonusPercent', { valueAsNumber: true })}
        />
        <Input
          id="max-bonus-usd"
          label="Max $"
          type="number"
          placeholder="0"
          error={errors.maxBonusUsd?.message}
          defaultValue={defaults.maxBonusUsd}
          {...register('maxBonusUsd', { valueAsNumber: true })}
        />
      </div>

      <Input
        id="expiry-date"
        label="Expiry Date"
        type="date"
        error={errors.expiryDate?.message}
        defaultValue={defaults.expiryDate}
        {...register('expiryDate')}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="eligibility" className="block text-sm font-semibold mb-2">
            Player Eligibility
          </label>
          <select
            id="eligibility"
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
            defaultValue={defaults.eligibility}
            {...register('eligibility')}
          >
            {options.eligibilities.map((e) => (
              <option key={e} value={e}>
                {eligibilityLabels[e] ?? e}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-semibold mb-2">
            {statusLabel}
          </label>
          <select
            id="status"
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
            defaultValue={defaults.status}
            {...register('status')}
          >
            {options.statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

