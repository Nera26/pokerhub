'use client';

import { useEffect, useRef, useState } from 'react';

type ToastVariant = 'info' | 'success' | 'error';

interface ToastOptions {
  duration?: number;
  variant?: ToastVariant;
}

interface Toast extends Required<ToastOptions> {
  id: number;
  message: string;
}

export default function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIds = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const nextId = useRef(0);

  const pushToast = (message: string, options: ToastOptions = {}) => {
    const { duration = 2200, variant = 'info' } = options;
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, variant, duration }].slice(-3));
    const timeoutId = setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
      timeoutIds.current.delete(id);
    }, duration);
    timeoutIds.current.set(id, timeoutId);
  };

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((tid) => clearTimeout(tid));
      timeoutIds.current.clear();
    };
  }, []);

  return { toasts, pushToast };
}
