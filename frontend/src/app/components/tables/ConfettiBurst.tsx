'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export default function ConfettiBurst({ triggerKey }: { triggerKey: number }) {
  const [pieces, setPieces] = useState<
    { id: number; dx: number; dy: number; color: string; style: CSSProperties }[]
  >([]);

  useEffect(() => {
    if (!triggerKey) return;
    const count = 12;
    const base = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        id: i,
        dx: Math.cos(angle) * 40,
        dy: Math.sin(angle) * 40,
        color: `hsl(${(i / count) * 360},100%,60%)`,
      };
    });
    setPieces(
      base.map((p) => ({
        ...p,
        style: {
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 1,
        },
      }))
    );
    const raf = requestAnimationFrame(() => {
      setPieces((prev) =>
        prev.map((p) => ({
          ...p,
          style: {
            transform: `translate(-50%, -50%) translate(${p.dx}px, ${p.dy}px) scale(1)`,
            opacity: 0,
            transition: 'transform 700ms ease-out, opacity 700ms ease-out',
          },
        }))
      );
    });
    const timeout = setTimeout(() => setPieces([]), 700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [triggerKey]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color, ...p.style }}
        />
      ))}
    </div>
  );
}

