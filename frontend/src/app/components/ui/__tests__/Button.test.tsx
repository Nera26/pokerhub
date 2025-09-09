import './setupLoggerMock';
import { render, screen } from '@testing-library/react';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';
import { logger } from '@/lib/logger';

describe('Button', () => {
  it('renders with text children', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders as a link when href is provided', () => {
    render(<Button href="/dashboard">Dashboard</Button>);
    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders icon-only usage', () => {
    render(
      <Button aria-label="settings" leftIcon={<svg data-testid="icon" />} />,
    );
    const btn = screen.getByRole('button', { name: 'settings' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', 'settings');
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

  it('disables button and sets aria-busy when loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('merges duplicate class names', () => {
    render(<Button className="px-4">Merge</Button>);
    const btn = screen.getByRole('button', { name: 'Merge' });
    expect(btn.className).toContain('px-4');
    expect(btn.className).not.toContain('px-6');
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
