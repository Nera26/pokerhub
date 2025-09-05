import { render, screen } from '@testing-library/react';
import { Input } from '../Input';
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

describe('Input', () => {
  it('sets aria attributes when error is present', () => {
    render(<Input id="username" label="Username" error="Required" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'username-error');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'username-error');
  });

  it('omits aria-describedby when there is no error', () => {
    render(<Input id="email" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it.each([{ props: { label: 'Email' } }, { props: { error: 'Required' } }])(
    'warns when id is missing but label or error is provided',
    ({ props }) => {
      const warn = logger.warn as jest.Mock;
      warn.mockClear();
      render(<Input {...props} />);
      expect(warn).toHaveBeenCalledWith(
        'Input: `id` is required when `label` or `error` is provided.',
      );
    },
  );
});
