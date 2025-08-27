import { useCallback, useRef } from 'react';

export function useWillChange<T extends HTMLElement = HTMLDivElement>(property = 'transform') {
  const ref = useRef<T | null>(null);

  const setWillChange = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = property;
    }
  }, [property]);

  const clearWillChange = useCallback(() => {
    if (ref.current) {
      ref.current.style.willChange = '';
    }
  }, []);

  return { ref, setWillChange, clearWillChange };
}

