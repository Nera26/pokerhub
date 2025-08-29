'use client';

import { useEffect, useState } from 'react';

interface BreakTimerProps {
  start: number;
  durationMs: number;
}

export default function BreakTimer({ start, durationMs }: BreakTimerProps) {
  const [remaining, setRemaining] = useState(
    durationMs - (Date.now() - start),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(durationMs - (Date.now() - start));
    }, 1000);
    return () => clearInterval(id);
  }, [start, durationMs]);

  if (remaining <= 0) return <span>Break over</span>;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span data-testid="break-timer">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}
