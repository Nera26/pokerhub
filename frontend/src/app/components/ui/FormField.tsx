'use client';

import type { ComponentProps, SelectHTMLAttributes } from 'react';
import {
  get,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';
import Input from './Input';

export interface TextFieldProps<T extends FieldValues>
  extends Omit<ComponentProps<typeof Input>, 'name'> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  registerOptions?: Parameters<UseFormRegister<T>>[1];
}

export function TextField<T extends FieldValues>({
  name,
  register,
  errors,
  id,
  registerOptions,
  ...props
}: TextFieldProps<T>) {
  const fieldId = id ?? String(name);
  const fieldError = get(errors, name);
  const error = fieldError?.message as string | undefined;

  return (
    <Input
      id={fieldId}
      error={error}
      {...register(name, registerOptions)}
      {...props}
    />
  );
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps<T extends FieldValues>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  label: string;
  options: ReadonlyArray<SelectFieldOption>;
  id?: string;
  registerOptions?: Parameters<UseFormRegister<T>>[1];
}

export function SelectField<T extends FieldValues>({
  name,
  register,
  errors,
  label,
  options,
  id,
  defaultValue,
  className = '',
  registerOptions,
  ...props
}: SelectFieldProps<T>) {
  const fieldId = id ?? String(name);
  const fieldError = get(errors, name);
  const error = fieldError?.message as string | undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const selectClassName = [
    'w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-semibold mb-2">
        {label}
      </label>
      <select
        id={fieldId}
        className={selectClassName}
        aria-invalid={!!error}
        aria-describedby={errorId}
        defaultValue={
          defaultValue as string | number | readonly string[] | undefined
        }
        {...register(name, registerOptions)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger-red mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default TextField;
