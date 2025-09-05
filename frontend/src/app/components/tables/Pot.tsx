'use client';

import { useEffect, useRef, useState } from 'react';
import ChipPile from '../ui/ChipPile';
import { useTableState } from '@/hooks/useTableState';

export default function Pot() {
  const { data: table } = useTableState();
  const total = table
    ? table.pot.main + table.pot.sidePots.reduce((a, b) => a + b, 0)
    : 0;
  const prev = useRef(total);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (total !== prev.current) {
      setAnimKey((k) => k + 1);
      prev.current = total;
    }
  }, [total]);

  if (!table) return null;

  return (
    <div className="relative flex flex-col items-center" data-pot>
      <div key={animKey} className="animate-[pot-slide_0.3s_ease-out]">
        <ChipPile amount={total} size="md" grounded />
      </div>
      <div className="mt-1 text-xs text-white/90">
        Pot ${(total / 100).toFixed(2)}
      </div>
      <style jsx>{`
        @keyframes pot-slide {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
