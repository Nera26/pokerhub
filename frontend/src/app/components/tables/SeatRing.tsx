'use client';

import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import PlayerSeat from './PlayerSeat';
import type { Player } from './types';
import CommunityCards from './CommunityCards';
import Pot from './Pot';
import ChipAnimator from './ChipAnimator';
import { useQueryClient } from '@tanstack/react-query';
import type { TableState } from '../../store/tableStore';
import { TableUiProvider } from './TableUiContext';
import { useTableTheme } from '@/hooks/useTableTheme';
import btnBadge from '/badges/btn.svg';
import sbBadge from '/badges/sb.svg';
import bbBadge from '/badges/bb.svg';

const BADGE_SRC: Record<string, string> = {
  BTN: btnBadge,
  SB: sbBadge,
  BB: bbBadge,
};

export interface SeatRingProps {
  players: Player[];
  communityCards: string[];
  pot: number;
  sidePots: number[];
  street: 'pre' | 'flop' | 'turn' | 'river';
  density: 'compact' | 'default' | 'large';
  handNumber: string;
  soundEnabled: boolean;
}

export default function SeatRing({
  players,
  communityCards,
  pot,
  sidePots,
  street,
  density,
  handNumber,
  soundEnabled,
}: SeatRingProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const rect = tableRef.current?.getBoundingClientRect();
      if (rect) setTableSize({ width: rect.width, height: rect.height });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // seat positions (snug oval + hero clamp)
  const seatStyles = useMemo<React.CSSProperties[]>(() => {
    const n = Math.max(players.length, 1);
    const CARD = {
      compact: { w: 72, h: 72 },
      default: { w: 80, h: 80 },
      large: { w: 88, h: 88 },
    } as const;
    const margin = 12;
    const outward = 8; // slight outward offset in px
    const { width: W, height: H } = tableSize;
    const padX = W ? ((CARD[density].w / 2 + margin) / W) * 100 : 0;
    const padY = H ? ((CARD[density].h / 2 + margin) / H) * 100 : 0;
    const rx = 50 - padX;
    const ry = 50 - padY;
    const offX = W ? (outward / W) * 100 : 0;
    const offY = H ? (outward / H) * 100 : 0;
    const yPower = 1.22;
    const xPower = 1.0;
    const LIFT_BOTTOM_MAX = 2.5;
    const HERO_MAX_TOP = 97;
    const step = 360 / n;
    const baseStartDeg = -90;
    const heroIndex = Math.max(
      0,
      players.findIndex((p) => p.username === 'You'),
    );
    const desiredHeroDeg = 90;
    const currentHeroDeg = baseStartDeg + step * heroIndex;
    const offset = desiredHeroDeg - currentHeroDeg;

    return Array.from({ length: n }, (_, idx) => {
      const deg = baseStartDeg + step * idx + offset;
      const t = (deg * Math.PI) / 180;
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      const x =
        50 +
        rx * Math.sign(cosT) * Math.pow(Math.abs(cosT), xPower) +
        cosT * offX;
      let y =
        50 +
        ry * Math.sign(sinT) * Math.pow(Math.abs(sinT), yPower) +
        sinT * offY;
      y -= Math.max(0, sinT) * LIFT_BOTTOM_MAX;
      if (idx === heroIndex && y > HERO_MAX_TOP) y = HERO_MAX_TOP;
      const lean = -cosT * 3; // subtle inward lean

      return {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${lean}deg)`,
        zIndex: 20,
      };
    });
  }, [players, density, tableSize]);

  const queryClient = useQueryClient();
  useEffect(() => {
    const tableState: TableState = {
      handId: handNumber,
      seats: players.map((p) => ({
        id: p.id,
        name: p.username,
        avatar: p.avatar,
        balance: p.chips,
        inHand: !p.isFolded,
      })),
      pot: { main: pot, sidePots },
      street,
    };
    queryClient.setQueryData(['table', 'local'], tableState);
  }, [players, pot, street, sidePots, handNumber, queryClient]);

  const { isLoading, isError } = useTableTheme();
  if (isLoading) {
    return <div>Loading table theme...</div>;
  }
  if (isError) {
    return <div>Failed to load theme</div>;
  }

  return (
    <TableUiProvider>
      <div className="flex-1">
        <div className="relative mx-auto w-[min(1450px,96vw)] p-6">
          <div
            ref={tableRef}
            className="relative w-full
                           h-[min(78vh,780px)]
                           rounded-full
                           overflow-hidden"
            style={{
              ...TABLE_COLORS,
              backgroundImage: `
                radial-gradient(ellipse at center, var(--felt-start) 0%, var(--felt-mid) 70%, var(--felt-end) 100%),
                url("${FELT_TEXTURE}"),
                radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, var(--felt-vignette) 100%)
              `,
              backgroundBlendMode: 'normal, overlay, multiply',
              backgroundSize: '100% 100%, 120px 120px, 100% 100%',
              border: '2px solid var(--table-rim)',
              boxShadow:
                '0 0 12px var(--table-rim-glow), 0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <ChipAnimator soundEnabled={soundEnabled}>
              <>
                {/* Center: community cards and pot */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <CommunityCards cards={communityCards ?? []} />

                  <Pot />

                  {/* Side pots (if any) */}
                  <div className="mt-3 min-h-5 text-[11px] md:text-xs text-text-secondary">
                    {sidePots.length > 0 ? (
                      sidePots.map((amt, i) => (
                        <div key={i}>
                          Side Pot {i + 1}: ${amt}
                        </div>
                      ))
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </div>
                </div>

                {/* Seats */}
                {(players ?? []).map((p, idx) => (
                  <PlayerSeat
                    key={p.id}
                    player={p}
                    style={seatStyles[idx]}
                    street={street}
                    density={density}
                    badge={BADGE_SRC[p.pos ?? '']}
                  />
                ))}
              </>
            </ChipAnimator>
          </div>
        </div>
      </div>
    </TableUiProvider>
  );
}

const TABLE_COLORS = {
  '--felt-start': 'var(--color-felt-start)',
  '--felt-mid': 'var(--color-felt-mid)',
  '--felt-end': 'var(--color-felt-end)',
  '--felt-vignette': 'var(--color-felt-vignette)',
  '--table-rim': 'var(--color-table-rim)',
  '--table-rim-glow': 'var(--color-table-rim-glow)',
} as React.CSSProperties;

const FELT_TEXTURE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyMDAgMjAwJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMScgbnVtT2N0YXZlcz0nNCcgc3RpdGNoVGlsZXM9J3N0aXRjaCcvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScyMDAnIGhlaWdodD0nMjAwJyBmaWx0ZXI9J3VybCgjbiknIC8+PC9zdmc+';
