'use client';

import React from 'react';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Accessible Button component. Supports optional left/right icons and ensures
 * icon-only buttons include an `aria-label` for screen readers.
 */

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'secondary'
  // NEW — tiny pill buttons that match the HTML exactly
  | 'chipBlue'
  | 'chipYellow';

export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Shared base properties for all buttons. Omits `children` so that we can
 * discriminate between buttons with textual content and icon-only buttons that
 * require an aria-label.
 */
interface ButtonBaseProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

type ButtonWithChildren = ButtonBaseProps & {
  children: React.ReactNode;
  'aria-label'?: string;
};

type IconOnlyButton = ButtonBaseProps & {
  children?: undefined;
  'aria-label': string; // enforce label for icon-only buttons
};

export type ButtonProps = ButtonWithChildren | IconOnlyButton;

const baseStyles =
  // inline-flex + gap ensures icon/text spacing is always correct
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-glow-yellow';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'px-6 py-3 bg-accent-green text-text-primary hover-glow-green',
  outline:
    'px-6 py-3 bg-transparent border border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-primary-bg',
  danger: 'px-6 py-3 bg-danger-red text-text-primary hover:brightness-110',
  ghost:
    'px-6 py-3 bg-transparent text-text-secondary hover:text-accent-yellow',
  secondary: 'px-6 py-3 bg-card-bg text-text-primary hover:bg-hover-bg',

  // NEW: pills used on Messages (and anywhere else you like)
  chipBlue:
    'px-3 py-1 rounded-lg text-xs font-semibold bg-accent-blue text-white',
  chipYellow:
    'px-3 py-1 rounded-lg text-xs font-bold bg-accent-yellow text-black',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: '',
  lg: 'px-7 py-4 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      loading = false,
      className = '',
      children,
      disabled,
      type,
      ...props
    },
    ref,
  ) => {
    // wrap plain text so flex gap works the same everywhere
    const normalizedChildren = React.Children.map(children, (child, i) =>
      typeof child === 'string' || typeof child === 'number' ? (
        <span key={i} className="inline-block">
          {child}
        </span>
      ) : (
        child
      ),
    );

    const isIconOnly = !normalizedChildren?.length && (leftIcon || rightIcon);
    if (env.NODE_ENV !== 'production' && isIconOnly && !props['aria-label']) {
      logger.warn(
        'Button: icon-only buttons should include an aria-label for accessibility',
      );
    }

    const classes = twMerge(
      clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      ),
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        type={type ?? 'button'}
        aria-busy={loading || undefined}
        data-variant={variant}
        {...props}
      >
        {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {normalizedChildren}
        {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
