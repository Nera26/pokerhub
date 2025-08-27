import { render, screen } from '@testing-library/react';
import { Button } from '@/app/components/ui/Button';

describe('Button', () => {
  it('applies variant and size styles', () => {
    render(
      <Button variant="outline" size="lg">
        Click
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn).toHaveAttribute('data-variant', 'outline');
    expect(btn.className).toContain('px-7');
  });

  it('applies chipBlue variant styles', () => {
    render(<Button variant="chipBlue">Blue</Button>);
    const btn = screen.getByRole('button', { name: 'Blue' });
    expect(btn).toHaveAttribute('data-variant', 'chipBlue');
    expect(btn.className).toContain('bg-accent-blue');
  });

  it('applies chipYellow variant styles', () => {
    render(<Button variant="chipYellow">Yellow</Button>);
    const btn = screen.getByRole('button', { name: 'Yellow' });
    expect(btn).toHaveAttribute('data-variant', 'chipYellow');
    expect(btn.className).toContain('bg-accent-yellow');
  });

  it('disables button and sets aria-busy when loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('supports icon-only usage when an aria-label is provided', () => {
    render(
      <Button aria-label="settings" leftIcon={<svg data-testid="icon" />} />,
    );
    const btn = screen.getByRole('button', { name: 'settings' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', 'settings');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('warns when icon-only button lacks aria-label', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error testing missing aria-label
      <Button leftIcon={<span>i</span>} />,
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('merges duplicate class names', () => {
    render(<Button className="px-4">Merge</Button>);
    const btn = screen.getByRole('button', { name: 'Merge' });
    expect(btn.className).toContain('px-4');
    expect(btn.className).not.toContain('px-6');
  });
});
