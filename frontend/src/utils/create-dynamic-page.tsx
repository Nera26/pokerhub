import dynamic from 'next/dynamic';
import type { ComponentType, ReactNode } from 'react';

interface DynamicPageOptions {
  /** Optional custom loading fallback */
  fallback?: ReactNode;
  /** Opt into SSR for the dynamic page */
  ssr?: boolean;
}

export default function createDynamicPage<T extends ComponentType>(
  importer: () => Promise<{ default: T }>,
  { fallback, ssr = false }: DynamicPageOptions = {},
) {
  return dynamic(importer, {
    loading: () =>
      fallback ?? (
        <div
          role="status"
          aria-live="polite"
          className="flex h-full w-full items-center justify-center py-10 text-sm text-text-secondary"
        >
          Loading…
        </div>
      ),
    ssr,
  });
}
