'use client';

import React, { lazy, Suspense, useMemo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

class ModuleErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: ReactNode }>,
  { hasError: boolean }
> {
  constructor(props: React.PropsWithChildren<{ fallback: ReactNode }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    logger.error(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface DashboardModuleProps<T extends object> {
  loader: () => Promise<{ default: React.ComponentType<T> }>;
  loading: ReactNode;
  error?: ReactNode;
  props?: T;
}

export default function DashboardModule<T extends object>({
  loader,
  loading,
  error = <div>Failed to load module.</div>,
  props,
}: DashboardModuleProps<T>) {
  const LazyComp = useMemo(() => lazy(loader), [loader]);
  const resolvedProps = props ?? ({} as T);

  return (
    <ModuleErrorBoundary fallback={error}>
      <Suspense fallback={loading}>
        <LazyComp {...resolvedProps} />
      </Suspense>
    </ModuleErrorBoundary>
  );
}
