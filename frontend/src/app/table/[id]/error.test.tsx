import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableError from './error';

describe('Table error boundary', () => {
  it('renders retry and back options', async () => {
    const reset = jest.fn();
    render(<TableError error={new Error('boom')} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry).toBeInTheDocument();
    await userEvent.click(retry);
    expect(reset).toHaveBeenCalled();
  });
});
