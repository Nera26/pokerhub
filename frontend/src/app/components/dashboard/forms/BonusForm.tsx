'use client';

import { useQuery } from '@tanstack/react-query';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Input from '../../ui/Input';
import type { BonusFormValues } from '../BonusManager';
import { fetchBonusOptions } from '@/lib/api/admin';
import type { ApiError } from '@/lib/api/client';
import { type BonusOptionsResponse } from '@shared/types';
import useFormField, { FieldError } from './formUtils';

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

  const field = useFormField(register, errors, defaults);
  const nameField = field('name');
  const typeField = field('type');
  const descriptionField = field('description');
  const bonusPercentField = field('bonusPercent', { valueAsNumber: true });
  const maxBonusField = field('maxBonusUsd', { valueAsNumber: true });
  const expiryField = field('expiryDate');
  const eligibilityField = field('eligibility');
  const statusField = field('status');

  return (
    <>
      <Input
        id="bonus-name"
        label="Promotion Name"
        placeholder="Enter promotion name..."
        error={nameField.error}
        defaultValue={nameField.defaultValue}
        {...nameField.register}
      />

      <div>
        <label
          htmlFor="bonus-type"
          className="block text-sm font-semibold mb-2"
        >
          Promotion Type
        </label>
        <select
          id="bonus-type"
          className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
          defaultValue={typeField.defaultValue}
          {...typeField.register}
        >
          {options.types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <FieldError message={typeField.error} />
      </div>

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
          defaultValue={descriptionField.defaultValue}
          {...descriptionField.register}
        />
        <FieldError message={descriptionField.error} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="bonus-percent"
          label="Bonus Amount (%)"
          type="number"
          placeholder="0"
          error={bonusPercentField.error}
          defaultValue={bonusPercentField.defaultValue}
          {...bonusPercentField.register}
        />
        <Input
          id="max-bonus-usd"
          label="Max $"
          type="number"
          placeholder="0"
          error={maxBonusField.error}
          defaultValue={maxBonusField.defaultValue}
          {...maxBonusField.register}
        />
      </div>

      <Input
        id="expiry-date"
        label="Expiry Date"
        type="date"
        error={expiryField.error}
        defaultValue={expiryField.defaultValue}
        {...expiryField.register}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="eligibility"
            className="block text-sm font-semibold mb-2"
          >
            Player Eligibility
          </label>
          <select
            id="eligibility"
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
            defaultValue={eligibilityField.defaultValue}
            {...eligibilityField.register}
          >
            {options.eligibilities.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <FieldError message={eligibilityField.error} />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-semibold mb-2">
            {statusLabel}
          </label>
          <select
            id="status"
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
            defaultValue={statusField.defaultValue}
            {...statusField.register}
          >
            {options.statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <FieldError message={statusField.error} />
        </div>
      </div>
    </>
  );
}
