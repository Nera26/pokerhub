'use client';

import { Component, ReactNode, useEffect } from 'react';
import { logger } from '@/lib/logger';

function Fallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-xl font-semibold">Something went wrong</h2>
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}

export class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <Fallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <Fallback onRetry={reset} />
      </body>
    </html>
  );
}
