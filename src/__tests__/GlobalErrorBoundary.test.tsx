import { render, screen } from '@testing-library/react';
import { GlobalErrorBoundary } from '../app/error';
import type { JSX } from 'react';

function Bomb(): JSX.Element {
  throw new Error('boom');
}

describe('GlobalErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    render(
      <GlobalErrorBoundary>
        <Bomb />
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
