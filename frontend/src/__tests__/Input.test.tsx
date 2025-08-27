import { render, screen } from '@testing-library/react';
import { Input } from '@/app/components/ui/Input';

describe('Input', () => {
  it('renders label and error with ARIA attributes', () => {
    render(<Input id="email" label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    const error = screen.getByText('Required');
    expect(input).toBeInTheDocument();
    expect(error).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(error).toHaveAttribute('id', 'email-error');
  });

  it('does not render invalid state when there is no error', () => {
    render(<Input id="username" label="Username" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('omits full width when fullWidth is false', () => {
    const { container } = render(<Input id="name" fullWidth={false} />);
    const input = container.querySelector('input');
    expect(input?.className).not.toContain('w-full');
  });
});
