import { render, screen } from '@testing-library/react';
import InlineError from '../InlineError';

describe('InlineError', () => {
  it('renders error message with alert role', () => {
    render(<InlineError message="Oops" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Oops');
  });
});
