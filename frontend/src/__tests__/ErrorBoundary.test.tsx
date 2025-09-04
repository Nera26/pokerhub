import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../app/components/ui/ErrorBoundary';
import ErrorFallback from '../app/components/ui/ErrorFallback';
import type { JSX } from 'react';

function Bomb(): JSX.Element {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    render(
      <ErrorBoundary fallback={<ErrorFallback onRetry={() => {}} />}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
