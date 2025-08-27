'use client';

import React from 'react';
import { useSetSeatPosition } from '../../store/tableStore';
import useRenderCount from '../../../hooks/useRenderCount';
import { useTableUi } from './TableUiContext';

import PlayerBalance from './PlayerBalance';
import PlayerHoleCards from './PlayerHoleCards';
import TimerRing from './TimerRing';
import ActionBubble from './ActionBubble';
import WinAnimation from './WinAnimation';
import type { Player } from './types';

export interface PlayerSeatProps {
  player: Player;
  style?: React.CSSProperties;
  street?: 'pre' | 'flop' | 'turn' | 'river';
  density?: 'compact' | 'default' | 'large';
}

export default function PlayerSeat({
  player,
  style,
  street: _street = 'pre',
  density = 'default',
}: PlayerSeatProps) {
  useRenderCount('PlayerSeat');
  const { pendingBySeat, setActiveSeat, activeSeatId } = useTableUi();
  const optimistic = pendingBySeat[player.id] || 0;
  const setSeatPosition = useSetSeatPosition();
  const displayedBalance = player.chips - optimistic;
  const isHero = player.username === 'You';
  const spotlight = player.id === activeSeatId && player.isActive;

  const sizeStyles = {
    compact: {
      avatar: 'w-[60px] h-[60px]',
      balance: 'mt-1',
    },
    default: {
      avatar: 'w-[70px] h-[70px]',
      balance: 'mt-1',
    },
    large: {
      avatar: 'w-[80px] h-[80px]',
      balance: 'mt-2',
    },
  } as const;
  const sz = sizeStyles[density];

  // Seat position tracking
  const xPercent =
    typeof style?.left === 'string' ? parseFloat(style.left) : 50;
  const yPercent = typeof style?.top === 'string' ? parseFloat(style.top) : 50;

  React.useEffect(() => {
    setSeatPosition(player.id, { x: xPercent, y: yPercent });
  }, [player.id, xPercent, yPercent, setSeatPosition]);

  React.useEffect(() => {
    if (player.isActive) setActiveSeat(player.id);
  }, [player.isActive, player.id, setActiveSeat]);

  const [hovered, setHovered] = React.useState(false);
  const expanded = hovered || player.isActive;

  return (
    <>
      <div
        className="absolute text-center select-none cursor-default"
        style={{ ...style, opacity: player.sittingOut ? 0.85 : 1 }}
        data-seat-id={player.id}
        tabIndex={0}
        role="button"
        aria-label={`Seat for ${player.username}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-200"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.15), rgba(255,255,255,0) 70%)',
            opacity: spotlight ? 1 : 0,
          }}
        />
        <div className="relative flex flex-col items-center z-20">
          <WinAnimation player={player}>
            {(winPulse) => (
              <TimerRing
                player={player}
                avatarClass={sz.avatar}
                winPulse={winPulse}
              />
            )}
          </WinAnimation>

          <PlayerBalance
            balance={displayedBalance}
            className={sz.balance}
            isAllIn={player.isAllIn}
            isWinner={player.isWinner}
          />

          <ActionBubble
            committed={player.committed ?? 0}
            lastAction={player.lastAction}
          />

          <div
            className={[
              'absolute left-1/2 -translate-x-1/2 flex flex-col items-center rounded bg-transparent px-2 py-1 text-xs text-white space-y-1',
              isHero ? 'bottom-full mb-2' : 'top-full mt-2',
              'transition-opacity transition-transform duration-200',
              expanded
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : `opacity-0 ${isHero ? 'translate-y-2' : '-translate-y-2'} pointer-events-none`,
            ].join(' ')}
          >
            <span className="font-semibold">{player.username}</span>
            {player.lastAction && <span>{player.lastAction}</span>}
            {isHero && <PlayerHoleCards cards={player.cards ?? []} isHero />}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes winnerPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }
        .winner-pulse {
          animation: winnerPulse 1s ease-in-out;
        }
      `}</style>
    </>
  );
}
