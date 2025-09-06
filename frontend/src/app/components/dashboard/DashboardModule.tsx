'use client';

import React, { lazy, Suspense, useMemo, ReactNode } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';

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
    <ErrorBoundary fallback={error}>
      <Suspense fallback={loading}>
        <LazyComp {...resolvedProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
