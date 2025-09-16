'use client';

import type {
  FieldErrors,
  FieldValues,
  UseFormRegister,
  Path,
} from 'react-hook-form';
import Input from '../../ui/Input';
import type { SelectHTMLAttributes } from 'react';

interface TextFieldProps<T extends FieldValues>
  extends React.ComponentProps<typeof Input> {
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
  const error = errors?.[name]?.message as string | undefined;
  return (
    <Input
      id={fieldId}
      error={error}
      {...register(name, registerOptions)}
      {...props}
    />
  );
}

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  label: string;
  options: SelectFieldOption[];
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
  registerOptions,
  ...props
}: SelectFieldProps<T>) {
  const fieldId = id ?? String(name);
  const error = errors?.[name]?.message as string | undefined;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-semibold mb-2">
        {label}
      </label>
      <select
        id={fieldId}
        className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
        aria-invalid={!!error}
        defaultValue={
          defaultValue as string | number | readonly string[] | undefined
        }
        {...register(name, registerOptions)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-danger-red mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
