'use client';

import React from 'react';
import { getServerTime } from '@/lib/server-time';

interface ActionTimerProps {
  /** Absolute server timestamp (ms) when the turn expires */
  deadline: number;
}

export default function ActionTimer({ deadline }: ActionTimerProps) {
  const [remaining, setRemaining] = React.useState(() =>
    Math.max(0, deadline - getServerTime()),
  );

  React.useEffect(() => {
    const tick = () => {
      const left = Math.max(0, deadline - getServerTime());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const seconds = Math.ceil(remaining / 1000);
  return <span data-testid="action-timer">{seconds}</span>;
}

