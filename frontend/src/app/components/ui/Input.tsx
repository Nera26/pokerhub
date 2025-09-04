'use client';

import React from 'react';
import { logger } from '@/lib/logger';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** If true, input takes full width */
  fullWidth?: boolean;
  /** Error message to display below input. Requires `id`. */
  error?: string;
  /** Label text for the input. Requires `id`. */
  label?: string;
}

const baseStyles =
  'bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 placeholder-text-text-secondary text-body-sm focus:outline-none focus-glow-yellow focus:border-accent-yellow';

export const Input: React.FC<InputProps> = ({
  fullWidth = true,
  className = '',
  error,
  label,
  id,
  ...props
}) => {
  const widthClass = fullWidth ? 'w-full' : '';
  const shouldWarn = (label || error) && !id;
  if (shouldWarn && process.env.NODE_ENV !== 'production') {
    logger.warn('Input: `id` is required when `label` or `error` is provided.');
  }
  const errorId = id ? `${id}-error` : undefined;
  const showLabel = !!label && !!id;
  const showError = !!error && !!id;
  return (
    <div className={`${widthClass} ${className}`}>
      {showLabel && (
        <label
          htmlFor={id}
          className="block text-subtext-sm text-text-secondary mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${baseStyles} ${widthClass}`}
        aria-invalid={!!error}
        aria-describedby={showError ? errorId : undefined}
        {...props}
      />
      {showError && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger-red">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
