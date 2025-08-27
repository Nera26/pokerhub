// Motion transition: m.fast
'use client';

import dynamic from 'next/dynamic';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import Button, { type ButtonProps } from './Button';
import { m } from '@/lib/motion';

const MotionButton = dynamic(
  async () => {
    const { motion } = await import('framer-motion');
    return motion.create<ComponentProps<typeof Button>, 'button'>(Button);
  },
  { ssr: false },
);

export default function SmoothButton({ className, ...props }: ButtonProps) {
  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={m.fast}
      className={clsx(
        'hover:will-change-transform motion-safe:transition-transform motion-reduce:transition-none',
        className,
      )}
      {...(props as ComponentProps<typeof MotionButton>)}
    />
  );
}
