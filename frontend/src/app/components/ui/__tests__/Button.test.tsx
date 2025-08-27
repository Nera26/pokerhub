import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Button', () => {
  it('renders with text children', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders icon-only usage', () => {
    render(
      <Button aria-label="settings" leftIcon={<svg data-testid="icon" />} />,
    );
    const btn = screen.getByRole('button', { name: 'settings' });
    expect(btn).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('warns when icon-only button lacks aria-label', () => {
    const warn = logger.warn as jest.Mock;
    render(
      // @ts-expect-error testing missing aria-label
      <Button leftIcon={<span />} />,
    );
    expect(warn).toHaveBeenCalledWith(
      'Button: icon-only buttons should include an aria-label for accessibility',
    );
  });

  describe('variant and size class combinations', () => {
    const variants: [ButtonVariant, string][] = [
      ['primary', 'bg-accent-green'],
      ['outline', 'border-accent-yellow'],
      ['danger', 'bg-danger-red'],
      ['ghost', 'text-text-secondary'],
      ['secondary', 'bg-card-bg'],
      ['chipBlue', 'bg-accent-blue'],
      ['chipYellow', 'bg-accent-yellow'],
    ];
    const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

    variants.forEach(([variant, variantClass]) => {
      sizes.forEach((size) => {
        it(`applies ${variant} variant with ${size} size`, () => {
          render(
            <Button variant={variant} size={size}>
              {variant}
            </Button>,
          );
          const btn = screen.getByRole('button', { name: variant });
          expect(btn).toHaveAttribute('data-variant', variant);
          expect(btn.className).toContain(variantClass);
          const sizeClass =
            size === 'sm'
              ? 'px-3 py-2'
              : size === 'lg'
                ? 'px-7 py-4'
                : variant === 'chipBlue' || variant === 'chipYellow'
                  ? 'px-3 py-1'
                  : 'px-6 py-3';
          sizeClass.split(' ').forEach((cls) => {
            expect(btn.className).toContain(cls);
          });
        });
      });
    });
  });
});
