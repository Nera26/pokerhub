'use client';

import { useId, type ChangeEvent } from 'react';
import clsx from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BuildSelectOptionsConfig<TData> {
  data?: TData[] | null;
  getValue: (item: TData) => string;
  getLabel: (item: TData) => string;
  prependOptions?: SelectOption[];
  filter?: (item: TData) => boolean;
  dedupe?: boolean;
}

export function buildSelectOptions<TData>({
  data,
  getValue,
  getLabel,
  prependOptions = [],
  filter,
  dedupe = true,
}: BuildSelectOptionsConfig<TData>): SelectOption[] {
  const result: SelectOption[] = [];
  const seen = new Set<string>();

  for (const option of prependOptions) {
    if (!dedupe || !seen.has(option.value)) {
      result.push(option);
      if (dedupe) {
        seen.add(option.value);
      }
    }
  }

  for (const item of data ?? []) {
    if (filter && !filter(item)) {
      continue;
    }

    const value = getValue(item);
    if (dedupe && seen.has(value)) {
      continue;
    }

    result.push({
      value,
      label: getLabel(item),
    });

    if (dedupe) {
      seen.add(value);
    }
  }

  return result;
}

export interface DateRangeConfig<TFilters extends Record<string, string>> {
  startKey: keyof TFilters;
  endKey: keyof TFilters;
  startLabel?: string;
  endLabel?: string;
  startId?: string;
  endId?: string;
}

export interface SelectConfig<TFilters extends Record<string, string>> {
  key: keyof TFilters;
  label: string;
  placeholderOption?: SelectOption;
  options?: SelectOption[];
  loading?: boolean;
  loadingLabel?: string;
  error?: boolean;
  errorLabel?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export interface TransactionHistoryFiltersProps<
  TFilters extends Record<string, string>,
> {
  filters: TFilters;
  onChange: (key: keyof TFilters, value: string) => void;
  dateRange?: DateRangeConfig<TFilters>;
  selects?: SelectConfig<TFilters>[];
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  onApply?: () => void;
  applyButtonLabel?: string;
  applyButtonClassName?: string;
  applyButtonDisabled?: boolean;
}

const defaultFieldClass =
  'bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm';

export default function TransactionHistoryFilters<
  TFilters extends Record<string, string>,
>({
  filters,
  onChange,
  dateRange,
  selects = [],
  className,
  inputClassName,
  selectClassName,
  onApply,
  applyButtonLabel = 'Apply',
  applyButtonClassName,
  applyButtonDisabled,
}: TransactionHistoryFiltersProps<TFilters>) {
  const idPrefix = useId();

  const handleInputChange = (
    key: keyof TFilters,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onChange(key, event.target.value);
  };

  const handleSelectChange = (
    key: keyof TFilters,
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onChange(key, event.target.value);
  };

  const resolvedInputClass = inputClassName ?? defaultFieldClass;
  const resolvedSelectClass = selectClassName ?? defaultFieldClass;

  return (
    <div className={clsx('flex flex-wrap gap-3 items-center', className)}>
      {dateRange && (
        <>
          {(() => {
            const startId = dateRange.startId ?? `${idPrefix}-start`;
            const startLabel = dateRange.startLabel ?? 'Start date';
            return (
              <div key={String(dateRange.startKey)} className="flex flex-col">
                <label htmlFor={startId} className="sr-only">
                  {startLabel}
                </label>
                <input
                  id={startId}
                  type="date"
                  className={resolvedInputClass}
                  value={filters[dateRange.startKey] ?? ''}
                  onChange={(event) =>
                    handleInputChange(dateRange.startKey, event)
                  }
                  aria-label={startLabel}
                />
              </div>
            );
          })()}
          {(() => {
            const endId = dateRange.endId ?? `${idPrefix}-end`;
            const endLabel = dateRange.endLabel ?? 'End date';
            return (
              <div key={String(dateRange.endKey)} className="flex flex-col">
                <label htmlFor={endId} className="sr-only">
                  {endLabel}
                </label>
                <input
                  id={endId}
                  type="date"
                  className={resolvedInputClass}
                  value={filters[dateRange.endKey] ?? ''}
                  onChange={(event) =>
                    handleInputChange(dateRange.endKey, event)
                  }
                  aria-label={endLabel}
                />
              </div>
            );
          })()}
        </>
      )}

      {selects.map((select) => {
        const selectId = select.id ?? `${idPrefix}-${String(select.key)}`;
        const placeholderOption = select.placeholderOption;
        const selectOptions = select.options ?? [];
        const loadingLabel = select.loadingLabel ?? 'Loading…';
        const errorLabel = select.errorLabel ?? 'Failed to load';
        const value = filters[select.key] ?? '';

        return (
          <div key={String(select.key)} className="flex flex-col">
            <label htmlFor={selectId} className="sr-only">
              {select.label}
            </label>
            <select
              id={selectId}
              className={clsx(resolvedSelectClass, select.className)}
              value={value}
              onChange={(event) => handleSelectChange(select.key, event)}
              aria-label={select.label}
              disabled={select.disabled}
            >
              {placeholderOption ? (
                <option
                  value={placeholderOption.value}
                  disabled={placeholderOption.disabled}
                >
                  {placeholderOption.label}
                </option>
              ) : null}
              {select.loading ? (
                <option disabled>{loadingLabel}</option>
              ) : select.error ? (
                <option disabled>{errorLabel}</option>
              ) : (
                selectOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>
        );
      })}

      {onApply ? (
        <button
          type="button"
          className={clsx(
            'bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition',
            applyButtonClassName,
          )}
          onClick={onApply}
          disabled={applyButtonDisabled}
        >
          {applyButtonLabel}
        </button>
      ) : null}
    </div>
  );
}
