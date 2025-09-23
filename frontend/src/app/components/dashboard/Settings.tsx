'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChipDenominations } from '@/hooks/useChipDenominations';
import { updateChipDenominations } from '@/lib/api/config';
import { useApiError } from '@/hooks/useApiError';
import Button from '../ui/Button';
import { TextField } from '../ui/FormField';

type FormFields = {
  denoms: string;
};

type ParseResult =
  | { success: true; denoms: number[] }
  | { success: false; message: string };

const INVALID_MESSAGE =
  'Denominations must be positive integers sorted from largest to smallest.';

function parseDenominations(input: string): ParseResult {
  const parts = input
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { success: false, message: 'Enter at least one denomination.' };
  }

  const denoms: number[] = [];

  for (const part of parts) {
    const value = Number(part);
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      return { success: false, message: INVALID_MESSAGE };
    }
    denoms.push(value);
  }

  for (let i = 1; i < denoms.length; i += 1) {
    if (denoms[i] > denoms[i - 1]) {
      return { success: false, message: INVALID_MESSAGE };
    }
  }

  return { success: true, denoms };
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error: queryError } = useChipDenominations();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormFields>({
    defaultValues: { denoms: '' },
  });

  useEffect(() => {
    if (data?.denoms?.length) {
      reset({ denoms: data.denoms.join(', ') });
    }
  }, [data, reset]);

  const {
    mutateAsync,
    isPending,
    isSuccess,
    error: mutationError,
  } = useMutation({
    mutationFn: (denoms: number[]) => updateChipDenominations(denoms),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['chip-denominations'] });
      reset({ denoms: response.denoms.join(', ') });
    },
  });

  useApiError(queryError || mutationError);

  const onSubmit = handleSubmit(async ({ denoms }) => {
    const result = parseDenominations(denoms);
    if (!result.success) {
      setError('denoms', { type: 'manual', message: result.message });
      return;
    }

    clearErrors('denoms');
    try {
      await mutateAsync(result.denoms);
    } catch (err) {
      // error handling is managed by useApiError through mutationError
    }
  });

  let content: JSX.Element;

  if (isLoading) {
    content = <p>Loading chip denominations...</p>;
  } else if (queryError) {
    content = (
      <p role="alert" className="text-danger-red">
        Failed to load chip denominations.
      </p>
    );
  } else {
    content = (
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          id="chip-denominations"
          name="denoms"
          label="Denominations"
          placeholder="1000, 500, 100, 25"
          autoComplete="off"
          register={register}
          registerOptions={{ required: 'Enter at least one denomination.' }}
          errors={errors}
        />
        <p className="text-xs text-text-secondary">
          Separate values with commas or spaces. Use descending order (largest
          to smallest).
        </p>
        <Button type="submit" loading={isPending} disabled={isPending}>
          Save Chip Denominations
        </Button>
        {isSuccess && (
          <p role="status" className="text-xs text-accent-green">
            Chip denominations saved.
          </p>
        )}
        {data?.denoms?.length ? (
          <p className="text-xs text-text-secondary">
            Current order: {data.denoms.join(' • ')}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <section
      className="bg-card-bg rounded-2xl p-6 space-y-4"
      data-testid="chip-denomination-settings"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Chip Denominations</h2>
        <p className="text-sm text-text-secondary">
          Control the chip values available on tables across PokerHub.
        </p>
      </header>
      {content}
    </section>
  );
}

export { parseDenominations };
