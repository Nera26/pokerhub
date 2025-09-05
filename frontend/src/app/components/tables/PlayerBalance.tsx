'use client';

import { useEffect, useRef, useState } from 'react';

export interface PlayerBalanceProps {
  balance: number;
  className: string;
  isAllIn?: boolean;
  isWinner?: boolean;
}

export default function PlayerBalance({
  balance,
  className,
  isAllIn,
  isWinner,
}: PlayerBalanceProps) {
  const prevBalance = useRef(balance);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    if (balance !== prevBalance.current) {
      setDelta(balance - prevBalance.current);
      prevBalance.current = balance;
    }
  }, [balance]);

  useEffect(() => {
    if (delta !== null) {
      const t = setTimeout(() => setDelta(null), 450);
      return () => clearTimeout(t);
    }
  }, [delta]);

  const balanceStr = (balance / 100).toFixed(2);
  const [whole, decimal] = balanceStr.split('.');

  return (
    <div
      className={[
        'relative w-full text-center text-sm font-bold text-white tracking-tight',
        className,
        isAllIn || isWinner ? 'animate-[balance-bloom_0.4s_ease-out]' : '',
      ].join(' ')}
    >
      {delta !== null && delta !== 0 && (
        <span
          className={[
            'absolute left-1/2 -translate-x-1/2 text-xs font-bold pointer-events-none',
            delta > 0
              ? 'text-green-400 animate-[balance-delta-up_0.4s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]'
              : 'text-red-400 animate-[balance-delta-down_0.4s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]',
          ].join(' ')}
          style={{
            top: delta > 0 ? 'calc(var(--space-lg) * -1)' : 'var(--space-lg)',
          }}
        >
          {`${delta > 0 ? '+' : '-'}$${(Math.abs(delta) / 100).toFixed(2)}`}
        </span>
      )}
      <span className="text-[0.9em]">$</span>
      {whole}
      <span className="text-[0.9em]">.{decimal}</span>
    </div>
  );
}
