import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../app/error';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('GlobalError', () => {
  it('renders RouteError and triggers retry', () => {
    const error = new Error('boom');
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    expect(
      screen.getByText(/something went wrong/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(error);
  });
});

