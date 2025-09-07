'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../ui/Input';
import { CreateTableSchema, GameTypeSchema } from '@shared/types';
import { type ReactNode } from 'react';

export type TableFormValues = z.infer<typeof CreateTableSchema>;

type Props = {
  defaultValues?: TableFormValues;
  submitLabel: ReactNode;
  onSubmit: (values: TableFormValues) => void;
  onCancel: () => void;
};

export default function TableForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(CreateTableSchema),
    defaultValues,
  });

  const submit = handleSubmit(onSubmit);

  return (
    <div className="p-6 space-y-4">
      <Input
        id="tableName"
        label="Table Name"
        error={errors.tableName?.message}
        {...register('tableName')}
      />

      <div>
        <label
          htmlFor="gameType"
          className="block text-sm font-semibold mb-2"
        >
          Game Type
        </label>
        <select
          id="gameType"
          className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow outline-none"
          {...register('gameType')}
        >
          {GameTypeSchema.options.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        {errors.gameType && (
          <p className="mt-1 text-xs text-danger-red">
            {errors.gameType.message}
          </p>
        )}
      </div>

      <Input
        id="stakes.small"
        type="number"
        label="Small Blind"
        error={errors.stakes?.small?.message}
        {...register('stakes.small', { valueAsNumber: true })}
      />
      <Input
        id="stakes.big"
        type="number"
        label="Big Blind"
        error={errors.stakes?.big?.message}
        {...register('stakes.big', { valueAsNumber: true })}
      />
      <Input
        id="startingStack"
        type="number"
        label="Starting Stack"
        error={errors.startingStack?.message}
        {...register('startingStack', { valueAsNumber: true })}
      />
      <Input
        id="players.max"
        type="number"
        label="Max Players"
        error={errors.players?.max?.message}
        {...register('players.max', { valueAsNumber: true })}
      />
      <Input
        id="buyIn.min"
        type="number"
        label="Min Buy-In"
        error={errors.buyIn?.min?.message}
        {...register('buyIn.min', { valueAsNumber: true })}
      />
      <Input
        id="buyIn.max"
        type="number"
        label="Max Buy-In"
        error={errors.buyIn?.max?.message}
        {...register('buyIn.max', { valueAsNumber: true })}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={submit}
          className="flex-1 bg-accent-green hover:bg-green-600 px-4 py-3 rounded-xl font-semibold"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

