import type {
  FieldErrors,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegister,
} from 'react-hook-form';
import type { ReactNode } from 'react';

export function useFormField<T extends FieldValues>(
  register: UseFormRegister<T>,
  errors: FieldErrors<T>,
  defaults: Partial<T> = {},
) {
  return function field<K extends FieldPath<T>>(
    name: K,
    options?: RegisterOptions<T, K>,
  ) {
    return {
      register: register(name, options),
      error: errors[name]?.message as string | undefined,
      defaultValue: defaults[name],
    };
  };
}

export function FieldError({ message }: { message?: ReactNode }) {
  if (!message) return null;
  return <p className="text-xs text-danger-red mt-1">{message}</p>;
}

export default useFormField;
