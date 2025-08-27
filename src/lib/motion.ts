import type { Transition } from 'framer-motion';

export const m: Record<'fast' | 'base' | 'slow', Transition> = {
  fast: { duration: 0.08, ease: 'easeOut' },
  base: { duration: 0.12, ease: 'easeOut' },
  slow: { duration: 0.2, ease: 'easeOut' },
};
