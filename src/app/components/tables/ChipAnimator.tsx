'use client';

import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  createContext,
  useContext,
} from 'react';
import {
  useSeatPositions,
  type CommitEvent,
  type SeatId,
  type Money,
} from '../../store/tableStore';
import { useTableState } from '@/hooks/useTableState';
import ChipPile from '../ui/ChipPile';
import useRenderCount from '../../../hooks/useRenderCount';

type Point = { x: number; y: number };

type ChipSprite = {
  id: string;
  seatId: SeatId;
  amount: Money;
  toSidePotIndex?: number;
  fromPot?: boolean;
};

interface ChipAnimatorContextValue {
  queueCommit: (ev: CommitEvent, winners?: SeatId[]) => void;
  animateWin: (seatId: SeatId, amount: Money) => void;
}

const ChipAnimatorContext = createContext<ChipAnimatorContextValue | null>(
  null,
);

export function useChipAnimator() {
  const ctx = useContext(ChipAnimatorContext);
  if (!ctx)
    throw new Error(
      'useChipAnimator must be used within ChipAnimator provider',
    );
  return ctx;
}

const AC =
  typeof window !== 'undefined'
    ? (
        window as Window &
          typeof globalThis & {
            webkitAudioContext?: typeof AudioContext;
          }
      ).AudioContext ||
      (
        window as Window &
          typeof globalThis & {
            webkitAudioContext?: typeof AudioContext;
          }
      ).webkitAudioContext
    : undefined;

function playClink() {
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 900;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore */
  }
}

function usePotRect(): { centerX: number; centerY: number } | null {
  const [rect, setRect] = useState<{ centerX: number; centerY: number } | null>(
    null,
  );
  useEffect(() => {
    const el = document.querySelector('[data-pot]');
    if (!el) return;
    const compute = () => {
      const r = (el as HTMLElement).getBoundingClientRect();
      setRect({ centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return rect;
}

function useSeatRectMap(): Record<
  number,
  { centerX: number; centerY: number }
> {
  const seatPositions = useSeatPositions();
  // Alternatively, subscribe to individual seat IDs if only one seat needs to trigger updates.
  const [map, setMap] = useState<
    Record<number, { centerX: number; centerY: number }>
  >({});
  useEffect(() => {
    const compute = () => {
      const els = document.querySelectorAll('[data-seat-id]');
      const m: Record<number, { centerX: number; centerY: number }> = {};
      els.forEach((el) => {
        const idAttr = (el as HTMLElement).getAttribute('data-seat-id');
        if (!idAttr) return;
        const r = (el as HTMLElement).getBoundingClientRect();
        m[Number(idAttr)] = {
          centerX: r.left + r.width / 2,
          centerY: r.top + r.height / 2,
        };
      });
      setMap(m);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [seatPositions]);
  return map;
}

function FlyingChip({
  id,
  amount,
  from,
  to,
  bounce,
}: {
  id: string;
  amount: number;
  from: Point;
  to: Point;
  bounce?: boolean;
}) {
  const [style, setStyle] = useState({
    transform: `translate(${from.x}px, ${from.y}px) scale(0.9)`,
    opacity: 0.9,
    transition: 'transform 500ms ease-out, opacity 500ms ease-out',
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        transform: `translate(${to.x}px, ${to.y}px) scale(1)`,
        opacity: 1,
      }));
    });
    return () => cancelAnimationFrame(raf);
  }, [to.x, to.y]);

  const handleTransitionEnd = () => {
    if (!bounce) return;
    setStyle({
      transform: `translate(${to.x}px, ${to.y}px) scale(1.15)`,
      opacity: 1,
      transition: 'transform 150ms ease-out',
    });
    setTimeout(() => {
      setStyle({
        transform: `translate(${to.x}px, ${to.y}px) scale(1)`,
        opacity: 1,
        transition: 'transform 150ms ease-out',
      });
    }, 150);
  };

  return (
    <div
      key={id}
      className="pointer-events-none fixed z-[40]"
      style={style}
      onTransitionEnd={handleTransitionEnd}
    >
      <ChipPile amount={amount} size="sm" />
    </div>
  );
}

export default function ChipAnimator({
  children,
  soundEnabled = true,
}: {
  children?: React.ReactNode;
  soundEnabled?: boolean;
}) {
  useRenderCount('ChipAnimator');
  const soundOn = soundEnabled; // component-level control
  const { data: table } = useTableState();
  const [flying, setFlying] = useState<ChipSprite[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPendingTimeouts = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  const queueCommit = useCallback((ev: CommitEvent, winners: SeatId[] = []) => {
    const betId = ev.actionId;
    setFlying((f) => [
      ...f,
      {
        id: betId,
        seatId: ev.seatId,
        amount: ev.amount,
        toSidePotIndex: ev.toSidePotIndex,
      },
    ]);
    const t1 = setTimeout(() => {
      if (winners.length) {
        setFlying((state) => [
          ...state.filter((s) => s.id !== betId),
          ...winners.map((w, i) => ({
            id: `${betId}-win-${i}`,
            seatId: w,
            amount: ev.amount,
            fromPot: true,
          })),
        ]);
        const t2 = setTimeout(() => {
          setFlying((state) =>
            state.filter(
              (s) => !winners.some((_, i) => s.id === `${betId}-win-${i}`),
            ),
          );
        }, 700);
        timeouts.current.push(t2);
      } else {
        setFlying((state) => state.filter((s) => s.id !== betId));
      }
    }, 500);
    timeouts.current.push(t1);
  }, []);

  const animateWin = useCallback((seatId: SeatId, amount: Money) => {
    const id = `win-${seatId}-${Date.now()}`;
    setFlying((f) => [...f, { id, seatId, amount, fromPot: true }]);
    const t = setTimeout(() => {
      setFlying((state) => state.filter((s) => s.id !== id));
    }, 700);
    timeouts.current.push(t);
  }, []);

  useEffect(() => () => clearPendingTimeouts(), [table, clearPendingTimeouts]);

  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (!soundOn) {
      seen.current = new Set(flying.map((f) => f.id));
      return;
    }
    const current = new Set<string>();
    flying.forEach((f) => {
      current.add(f.id);
      if (!seen.current.has(f.id)) playClink();
    });
    seen.current = current;
  }, [flying, soundOn]);

  const potRect = usePotRect();
  const seatRect = useSeatRectMap();

  const contextValue = useMemo(
    () => ({ queueCommit, animateWin }),
    [queueCommit, animateWin],
  );

  return (
    <ChipAnimatorContext.Provider value={contextValue}>
      {children}
      {flying.map((sprite) => {
        const from = sprite.fromPot ? potRect : seatRect[sprite.seatId];
        const to = sprite.fromPot ? seatRect[sprite.seatId] : potRect;
        if (!from || !to) return null;
        return (
          <FlyingChip
            key={sprite.id}
            id={sprite.id}
            amount={sprite.amount}
            from={{ x: from.centerX, y: from.centerY }}
            to={{ x: to.centerX, y: to.centerY }}
            bounce={sprite.fromPot}
          />
        );
      })}
    </ChipAnimatorContext.Provider>
  );
}
