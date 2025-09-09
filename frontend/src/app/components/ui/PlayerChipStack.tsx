'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons/faSpinner';
import { useChipDenominations } from '@/hooks/useChipDenominations';

type Size = 'sm' | 'md' | 'lg';

interface ChipStackProps {
  amount: number;
  size?: Size;
}

const DEFAULT_DENOMS = [1000, 100, 25] as const;

/** Tiny chip SVG used in badges and committed tags */
function ChipIcon({
  color = 'gold',
  size = 14,
  className = '',
}: {
  color?: 'gold' | 'black' | 'green';
  size?: number;
  className?: string;
}) {
  const fill =
    color === 'gold'
      ? 'var(--color-chip-gold)'
      : color === 'black'
        ? 'var(--color-chip-black)'
        : 'var(--color-chip-green)';
  const ring =
    color === 'gold'
      ? 'var(--color-chip-gold-ring)'
      : color === 'black'
        ? 'var(--color-chip-black-ring)'
        : 'var(--color-chip-green-ring)';
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <circle cx={r} cy={r} r={r} fill={fill} />
      <circle cx={r} cy={r} r={r * 0.78} fill={ring} />
      <circle cx={r} cy={r} r={r * 0.58} fill={fill} />
    </svg>
  );
}

/**
 * Casino-style chip stack + amount pill.
 * - Denominations fetched from backend with fallback
 * - Compact visual stack (auto-clamps chip count per denom)
 * - Win/loss animation: slide up (green) on increase, slide down (red) on decrease
 */
export default function PlayerChipStack({
  amount,
  size = 'sm',
}: ChipStackProps) {
  const { data, isLoading } = useChipDenominations();
  const denoms = data?.denoms ?? DEFAULT_DENOMS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin />
      </div>
    );
  }
  const prevRef = useRef(amount);
  const [delta, setDelta] = useState(0);
  const [animKey, setAnimKey] = useState(0); // bump to retrigger CSS animations

  useEffect(() => {
    const d = amount - prevRef.current;
    if (d !== 0) {
      setDelta(d);
      setAnimKey((k) => k + 1);
      prevRef.current = amount;
    }
  }, [amount]);

  const dims = useMemo(() => {
    switch (size) {
      case 'lg':
        return { chip: 14, gap: 2, font: 'text-base' };
      case 'md':
        return { chip: 12, gap: 2, font: 'text-sm' };
      default:
        return { chip: 10, gap: 2, font: 'text-xs' };
    }
  }, [size]);

  // Denomination breakdown (greedy)
  const breakdown = useMemo(() => {
    let remaining = Math.max(0, Math.floor(amount));
    const res: Record<number, number> = {};
    for (const d of denoms) {
      res[d] = 0;
      if (remaining >= d) {
        res[d] = Math.floor(remaining / d);
        remaining = remaining % d;
      }
    }
    return res;
  }, [amount, denoms]);

  // Render at most N chips per denom to keep the icon compact
  const MAX_CHIPS_PER_DENOM = 4;

  function renderChip(color: 'gold' | 'black' | 'green', i: number) {
    const sizePx = `${dims.chip}px`;
    return (
      <div
        key={`${color}-${i}`}
        className="relative rounded-full border border-black/60 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
        style={{
          width: sizePx,
          height: sizePx,
          marginTop: i === 0 ? 0 : -dims.gap,
          transform: `translateY(${i * -1}px) translateZ(${i * 2}px)`,
          background:
            color === 'gold'
              ? 'var(--gradient-chip-gold)'
              : color === 'black'
                ? 'var(--gradient-chip-black)'
                : 'var(--gradient-chip-green)',
          boxShadow: `0 2px 3px var(--shadow-chip)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: 'var(--gradient-chip-highlight)' }}
        />
      </div>
    );
  }

  function chipColumn(denom: number, index: number) {
    const count = breakdown[denom];
    if (!count) return null;

    const color = index === 0 ? 'gold' : index === 1 ? 'black' : 'green';
    const shown = Math.min(count, MAX_CHIPS_PER_DENOM);
    const overflow = count - shown;

    return (
      <div
        key={denom}
        className="flex flex-col items-center"
        style={{
          transform: 'perspective(60px) rotateX(45deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {Array.from({ length: shown }).map((_, i) => renderChip(color, i))}
        {overflow > 0 && (
          <div className="mt-0.5 leading-none text-[9px] px-1 rounded-full bg-black/60 text-white/80 border border-white/10">
            ×{count}
          </div>
        )}
      </div>
    );
  }

  // Slide direction class
  const slideCls =
    delta === 0
      ? ''
      : delta > 0
        ? 'pcs-slide-up pcs-win-glow'
        : 'pcs-slide-down pcs-lose-glow';

  return (
    <div className="relative inline-flex items-center">
      {/* dark translucent pill to ensure readability on green felt */}
      <div className="relative z-0 rounded-full bg-black/55 border border-white/10 backdrop-blur-[1px] px-2 py-1">
        <div className="flex items-center gap-2">
          {/* Chip columns */}
          <div className="flex items-end gap-1">
            {denoms.map((d, i) => chipColumn(d, i))}
          </div>

          {/* Amount with slide animation */}
          <div
            key={animKey} // key to retrigger animation on every change
            className={`font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] ${dims.font} ${slideCls}`}
            style={{ minWidth: 52, textAlign: 'right' }}
          >
            ${amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* local styles */}
      <style jsx>{`
        .pcs-slide-up {
          animation: pcsSlideUp 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .pcs-slide-down {
          animation: pcsSlideDown 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .pcs-win-glow::after,
        .pcs-lose-glow::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          pointer-events: none;
          filter: blur(6px);
          opacity: 0.7;
        }
        .pcs-win-glow::after {
          background: radial-gradient(
            60% 60% at 50% 50%,
            rgba(16, 185, 129, 0.35),
            transparent
          );
        }
        .pcs-lose-glow::after {
          background: radial-gradient(
            60% 60% at 50% 50%,
            rgba(239, 68, 68, 0.35),
            transparent
          );
        }
        @keyframes pcsSlideUp {
          0% {
            transform: translateY(6px);
            opacity: 0.2;
            filter: brightness(0.9);
          }
          60% {
            transform: translateY(-2px);
            opacity: 1;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
            filter: brightness(1);
          }
        }
        @keyframes pcsSlideDown {
          0% {
            transform: translateY(-6px);
            opacity: 0.2;
            filter: brightness(1.05);
          }
          60% {
            transform: translateY(2px);
            opacity: 1;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  );
}
