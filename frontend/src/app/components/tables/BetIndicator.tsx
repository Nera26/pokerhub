'use client';

import React from 'react';
import ChipPile from '../ui/ChipPile';

interface BetIndicatorProps {
  amount: number;
  className?: string;
}

export default function BetIndicator({ amount, className = '' }: BetIndicatorProps) {
  const [show, setShow] = React.useState(amount > 0);
  const [displayAmount, setDisplayAmount] = React.useState(amount);

  React.useEffect(() => {
    if (amount > 0) {
      setDisplayAmount(amount);
      setShow(true);
    } else if (show) {
      const t = setTimeout(() => {
        setShow(false);
        setDisplayAmount(0);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [amount, show]);

  return (
    <div
      className={[
        'pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'transition-opacity transition-transform duration-200 ease-out',
          amount > 0
            ? 'translate-y-0 translate-x-0 opacity-100 scale-100'
            : '-translate-y-2 translate-x-0 opacity-0 scale-75',
        ].join(' ')}
      >
        {show && <ChipPile amount={displayAmount} size="sm" grounded />}
      </div>
    </div>
  );
}

