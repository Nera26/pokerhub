'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import useToasts from '@/hooks/useToasts';
import type { ApiError } from '@/lib/api/client';

interface ApiErrorContextValue {
  pushError: (message: string) => void;
}

const ApiErrorContext = createContext<ApiErrorContextValue | undefined>(
  undefined,
);

const GLOBAL_ERROR_EVENT = 'global-error';

export function dispatchGlobalError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_ERROR_EVENT, { detail: message }),
    );
  }
}

export function ApiErrorProvider({ children }: { children: ReactNode }) {
  const { toasts, pushToast } = useToasts();
  const pushError = useCallback(
    (message: string) =>
      pushToast(message, { variant: 'error', duration: 5000 }),
    [pushToast],
  );

  useEffect(() => {
    const handler = (e: Event) =>
      pushError((e as CustomEvent<string>).detail);
    window.addEventListener(GLOBAL_ERROR_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_ERROR_EVENT, handler as EventListener);
    };
  }, [pushError]);

  return (
    <ApiErrorContext.Provider value={{ pushError }}>
      {children}
      <div
        className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50 space-y-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={
              'px-3 py-1 text-sm rounded-xl shadow-md border ' +
              (t.variant === 'error'
                ? 'bg-danger-red text-white border-danger-red'
                : t.variant === 'success'
                  ? 'bg-accent-green text-white border-accent-green'
                  : 'bg-card-bg/90 border-border-color')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ApiErrorContext.Provider>
  );
}

/**
 * Maps an {@link ApiError} object to a human-readable message.
 * Returns `null` if no error is provided.
 */
export function useApiError(error: unknown) {
  const ctx = useContext(ApiErrorContext);

  const message = useMemo(() => {
    if (!error) return null;
    const err = error as ApiError;
    let msg = '';
    if (err.status) msg += `${err.status} `;
    if (err.message) msg += err.message;
    if (!msg && err.errors) msg = Object.values(err.errors).join(', ');
    if (err.details) msg = msg ? `${msg}: ${err.details}` : err.details;
    return msg || 'Unknown error';
  }, [error]);

  useEffect(() => {
    if (message && ctx) ctx.pushError(message);
  }, [message, ctx]);

  return message;
}
