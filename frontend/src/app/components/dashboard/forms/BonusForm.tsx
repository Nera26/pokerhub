'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Input from '../../ui/Input';
import type { BonusFormValues } from '../BonusManager';

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
          <option value="deposit">Deposit Match</option>
          <option value="rakeback">Rakeback</option>
          <option value="ticket">Tournament Tickets</option>
          <option value="rebate">Rebate</option>
          <option value="first-deposit">First Deposit Only</option>
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
            <option value="all">All Players</option>
            <option value="new">New Players Only</option>
            <option value="vip">VIP Players Only</option>
            <option value="active">Active Players</option>
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
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>
    </>
  );
}

