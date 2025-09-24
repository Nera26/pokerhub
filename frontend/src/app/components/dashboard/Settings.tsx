'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChipDenominations } from '@/hooks/useChipDenominations';
import { usePerformanceThresholds } from '@/hooks/usePerformanceThresholds';
import {
  updateChipDenominations,
  updatePerformanceThresholds,
} from '@/lib/api/config';
import { useApiError } from '@/hooks/useApiError';
import Button from '../ui/Button';
import { TextField } from '../ui/FormField';
import Input from '../ui/Input';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import useUpdateTransactionColumns from '@/hooks/useUpdateTransactionColumns';
import type { PerformanceThresholdsResponse } from '@shared/types';
import type { TransactionColumn } from '@shared/transactions.schema';

type DenominationFormFields = {
  denoms: string;
};

type ThresholdFormFields = {
  INP: string;
  LCP: string;
  CLS: string;
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

const THRESHOLD_FIELDS: Record<
  keyof ThresholdFormFields,
  {
    label: string;
    placeholder: string;
    description: string;
    step?: string;
    min?: number;
    max?: number;
    suffix?: string;
  }
> = {
  INP: {
    label: 'Interaction to Next Paint (INP)',
    placeholder: '150',
    description: 'Milliseconds before user input is visually acknowledged.',
    min: 0,
    step: '1',
    suffix: 'ms',
  },
  LCP: {
    label: 'Largest Contentful Paint (LCP)',
    placeholder: '2500',
    description: 'Milliseconds before the main content is visible.',
    min: 0,
    step: '1',
    suffix: 'ms',
  },
  CLS: {
    label: 'Cumulative Layout Shift (CLS)',
    placeholder: '0.05',
    description: 'Unitless score between 0 and 1 for layout stability.',
    min: 0,
    max: 1,
    step: '0.01',
  },
};

export default function Settings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error: queryError } = useChipDenominations();
  const {
    data: thresholds,
    isLoading: isLoadingThresholds,
    error: thresholdQueryError,
  } = usePerformanceThresholds();

  const {
    data: transactionColumns,
    isLoading: isLoadingColumns,
    error: columnsQueryError,
  } = useTransactionColumns();

  const [columnsDraft, setColumnsDraft] = useState<TransactionColumn[]>([]);
  const [columnsValidationError, setColumnsValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isLoadingColumns && !columnsQueryError) {
      setColumnsDraft(transactionColumns);
    }
  }, [transactionColumns, isLoadingColumns, columnsQueryError]);

  const {
    mutateAsync: saveColumns,
    isPending: isSavingColumns,
    isSuccess: columnsSaved,
    error: columnsMutationError,
  } = useUpdateTransactionColumns();

  const normalizedDraft = useMemo(
    () =>
      columnsDraft.map((column) => ({
        id: column.id,
        label: column.label,
      })),
    [columnsDraft],
  );

  const normalizedBaseline = useMemo(
    () =>
      transactionColumns.map((column) => ({
        id: column.id,
        label: column.label,
      })),
    [transactionColumns],
  );

  const columnsDirty = useMemo(() => {
    return (
      JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedBaseline)
    );
  }, [normalizedDraft, normalizedBaseline]);

  const handleColumnIdChange = (index: number, id: string) => {
    setColumnsDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], id };
      return next;
    });
    setColumnsValidationError(null);
  };

  const handleColumnLabelChange = (index: number, label: string) => {
    setColumnsDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label };
      return next;
    });
    setColumnsValidationError(null);
  };

  const moveColumn = (index: number, direction: number) => {
    setColumnsDraft((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setColumnsValidationError(null);
  };

  const removeColumn = (index: number) => {
    setColumnsDraft((prev) => prev.filter((_, i) => i !== index));
    setColumnsValidationError(null);
  };

  const addColumn = () => {
    setColumnsDraft((prev) => {
      const existingIds = new Set(prev.map((column) => column.id));
      let counter = prev.length + 1;
      let candidate = `column_${counter}`;
      while (existingIds.has(candidate)) {
        counter += 1;
        candidate = `column_${counter}`;
      }
      return [...prev, { id: candidate, label: '' }];
    });
    setColumnsValidationError(null);
  };

  const resetColumns = () => {
    setColumnsDraft(transactionColumns);
    setColumnsValidationError(null);
  };

  const handleColumnsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = columnsDraft.map((column) => ({
      id: column.id.trim(),
      label: column.label.trim(),
    }));

    if (normalized.length === 0) {
      setColumnsValidationError('Add at least one column before saving.');
      return;
    }

    const hasEmptyField = normalized.some(
      (column) => column.id.length === 0 || column.label.length === 0,
    );
    if (hasEmptyField) {
      setColumnsValidationError(
        'Column ID and label are required for every column.',
      );
      return;
    }

    const uniqueIds = new Set(normalized.map((column) => column.id));
    if (uniqueIds.size !== normalized.length) {
      setColumnsValidationError('Column IDs must be unique.');
      return;
    }

    setColumnsValidationError(null);
    setColumnsDraft(normalized);

    try {
      await saveColumns(normalized);
    } catch (err) {
      // handled by useApiError
    }
  };

  const canSaveColumns = columnsDraft.length > 0 && columnsDirty;
  const canResetColumns = columnsDirty;

  const {
    register: registerDenoms,
    handleSubmit: handleDenomSubmit,
    setError: setDenomError,
    clearErrors: clearDenomErrors,
    reset: resetDenoms,
    formState: { errors: denomErrors },
  } = useForm<DenominationFormFields>({
    defaultValues: { denoms: '' },
  });

  const {
    register: registerThreshold,
    handleSubmit: handleThresholdSubmit,
    setError: setThresholdError,
    clearErrors: clearThresholdErrors,
    reset: resetThresholds,
    formState: { errors: thresholdErrors },
  } = useForm<ThresholdFormFields>({
    defaultValues: { INP: '', LCP: '', CLS: '' },
  });

  useEffect(() => {
    if (data?.denoms?.length) {
      resetDenoms({ denoms: data.denoms.join(', ') });
    }
  }, [data, resetDenoms]);

  useEffect(() => {
    if (thresholds) {
      resetThresholds({
        INP: thresholds.INP.toString(),
        LCP: thresholds.LCP.toString(),
        CLS: thresholds.CLS.toString(),
      });
    }
  }, [thresholds, resetThresholds]);

  const {
    mutateAsync: updateDenoms,
    isPending,
    isSuccess,
    error: mutationError,
  } = useMutation({
    mutationFn: (denoms: number[]) => updateChipDenominations(denoms),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['chip-denominations'] });
      resetDenoms({ denoms: response.denoms.join(', ') });
    },
  });

  const {
    mutateAsync: updateThresholds,
    isPending: isSavingThresholds,
    isSuccess: thresholdsSaved,
    error: thresholdMutationError,
  } = useMutation({
    mutationFn: (payload: PerformanceThresholdsResponse) =>
      updatePerformanceThresholds(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ['performance-thresholds'],
      });
      queryClient.setQueryData(['performance-thresholds'], response);
      resetThresholds({
        INP: response.INP.toString(),
        LCP: response.LCP.toString(),
        CLS: response.CLS.toString(),
      });
    },
  });

  useApiError(
    queryError ||
      mutationError ||
      thresholdQueryError ||
      thresholdMutationError ||
      columnsQueryError ||
      columnsMutationError,
  );

  const onSubmit = handleDenomSubmit(async ({ denoms }) => {
    const result = parseDenominations(denoms);
    if (!result.success) {
      setDenomError('denoms', { type: 'manual', message: result.message });
      return;
    }

    clearDenomErrors('denoms');
    try {
      await updateDenoms(result.denoms);
    } catch (err) {
      // error handling is managed by useApiError through mutationError
    }
  });

  const onThresholdSubmit = handleThresholdSubmit(async (values) => {
    const parsed: Partial<PerformanceThresholdsResponse> = {};
    let hasError = false;

    (Object.entries(values) as [keyof ThresholdFormFields, string][]).forEach(
      ([key, raw]) => {
        const config = THRESHOLD_FIELDS[key];
        const trimmed = raw.trim();
        if (!trimmed) {
          setThresholdError(key, {
            type: 'manual',
            message: `Enter a value for ${config.label}.`,
          });
          hasError = true;
          return;
        }

        const value = Number(trimmed);
        if (!Number.isFinite(value)) {
          setThresholdError(key, {
            type: 'manual',
            message: `${config.label} must be a valid number.`,
          });
          hasError = true;
          return;
        }

        if (config.min !== undefined && value < config.min) {
          setThresholdError(key, {
            type: 'manual',
            message: `${config.label} must be at least ${config.min}.`,
          });
          hasError = true;
          return;
        }

        if (config.max !== undefined && value > config.max) {
          setThresholdError(key, {
            type: 'manual',
            message: `${config.label} must be at most ${config.max}.`,
          });
          hasError = true;
          return;
        }

        (parsed as PerformanceThresholdsResponse)[key] = value;
      },
    );

    if (hasError) {
      return;
    }

    clearThresholdErrors();

    try {
      await updateThresholds(parsed as PerformanceThresholdsResponse);
    } catch (err) {
      // handled by useApiError
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
          register={registerDenoms}
          registerOptions={{ required: 'Enter at least one denomination.' }}
          errors={denomErrors}
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

  let thresholdContent: JSX.Element;

  if (isLoadingThresholds) {
    thresholdContent = <p>Loading performance thresholds...</p>;
  } else if (thresholdQueryError) {
    thresholdContent = (
      <p role="alert" className="text-danger-red">
        Failed to load performance thresholds.
      </p>
    );
  } else {
    thresholdContent = (
      <form onSubmit={onThresholdSubmit} className="space-y-4" noValidate>
        {(
          Object.keys(THRESHOLD_FIELDS) as Array<keyof ThresholdFormFields>
        ).map((key) => {
          const field = THRESHOLD_FIELDS[key];
          const id = `threshold-${key.toLowerCase()}`;
          return (
            <div key={key} className="space-y-2">
              <TextField
                id={id}
                name={key}
                label={field.label}
                placeholder={field.placeholder}
                type="number"
                step={field.step}
                min={field.min}
                max={field.max}
                inputMode="decimal"
                autoComplete="off"
                register={registerThreshold}
                errors={thresholdErrors}
              />
              <p className="text-xs text-text-secondary">{field.description}</p>
            </div>
          );
        })}
        <Button
          type="submit"
          loading={isSavingThresholds}
          disabled={isSavingThresholds}
        >
          Save Performance Thresholds
        </Button>
        {thresholdsSaved && (
          <p role="status" className="text-xs text-accent-green">
            Performance thresholds saved.
          </p>
        )}
        {thresholds ? (
          <p className="text-xs text-text-secondary">
            Current thresholds: INP {thresholds.INP} ms • LCP {thresholds.LCP}{' '}
            ms • CLS {thresholds.CLS}
          </p>
        ) : null}
      </form>
    );
  }

  let columnsContent: JSX.Element;

  if (isLoadingColumns) {
    columnsContent = <p>Loading transaction columns...</p>;
  } else if (columnsQueryError) {
    columnsContent = (
      <p role="alert" className="text-danger-red">
        Failed to load transaction columns.
      </p>
    );
  } else {
    columnsContent = (
      <form onSubmit={handleColumnsSubmit} className="space-y-4" noValidate>
        <div className="space-y-3">
          {columnsDraft.map((column, index) => (
            <div
              key={`${column.id}-${index}`}
              className="space-y-3 rounded-2xl border border-border-dark p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-text-secondary">
                  Column {index + 1}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-accent-blue disabled:text-text-secondary"
                    onClick={() => moveColumn(index, -1)}
                    disabled={index === 0 || isSavingColumns}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-accent-blue disabled:text-text-secondary"
                    onClick={() => moveColumn(index, 1)}
                    disabled={
                      index === columnsDraft.length - 1 || isSavingColumns
                    }
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-danger-red disabled:text-text-secondary"
                    onClick={() => removeColumn(index)}
                    disabled={isSavingColumns}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  id={`transaction-column-${index}-id`}
                  label="Column ID"
                  value={column.id}
                  onChange={(event) =>
                    handleColumnIdChange(index, event.target.value)
                  }
                  placeholder="Unique key (e.g., date)"
                  autoComplete="off"
                />
                <Input
                  id={`transaction-column-${index}-label`}
                  label="Label"
                  value={column.label}
                  onChange={(event) =>
                    handleColumnLabelChange(index, event.target.value)
                  }
                  placeholder="Displayed label"
                  autoComplete="off"
                />
              </div>
            </div>
          ))}
        </div>
        {columnsDraft.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No columns configured yet. Add columns to control the transaction
            history table.
          </p>
        ) : null}
        {columnsValidationError ? (
          <p role="alert" className="text-xs text-danger-red">
            {columnsValidationError}
          </p>
        ) : null}
        <p className="text-xs text-text-secondary">
          Column IDs must match the fields returned by the transactions API.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addColumn}
            disabled={isSavingColumns}
          >
            Add Column
          </Button>
          <Button
            type="submit"
            loading={isSavingColumns}
            disabled={!canSaveColumns || isSavingColumns}
          >
            Save Transaction Columns
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetColumns}
            disabled={!canResetColumns || isSavingColumns}
          >
            Reset Changes
          </Button>
        </div>
        {columnsSaved && (
          <p role="status" className="text-xs text-accent-green">
            Transaction columns saved.
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-6">
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

      <section
        className="bg-card-bg rounded-2xl p-6 space-y-4"
        data-testid="performance-threshold-settings"
      >
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">Performance Thresholds</h2>
          <p className="text-sm text-text-secondary">
            Tune the web vital targets that trigger performance alerts.
          </p>
        </header>
        {thresholdContent}
      </section>

      <section
        className="bg-card-bg rounded-2xl p-6 space-y-4"
        data-testid="transaction-columns-settings"
      >
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">Transaction Columns</h2>
          <p className="text-sm text-text-secondary">
            Adjust the order and labels used for the transaction history table.
          </p>
        </header>
        {columnsContent}
      </section>
    </div>
  );
}

export { parseDenominations };
