'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { POSITION_RING } from './colorTokens';
import PlayerAvatar from './PlayerAvatar';
import type { Player } from './types';
import { getServerTime } from '@/lib/server-time';

interface TimerRingProps {
  player: Player;
  avatarClass: string;
  winPulse: boolean;
}

export default function TimerRing({
  player,
  avatarClass,
  winPulse,
}: TimerRingProps) {
  const [timeLeft, setTimeLeft] = useState(player.timeLeft ?? 0);
  const totalTimeRef = useRef(player.timeLeft ?? 0);

  useEffect(() => {
    totalTimeRef.current = player.timeLeft ?? 0;
    setTimeLeft(player.timeLeft ?? 0);
  }, [player.timeLeft]);

  useEffect(() => {
    if (!player.isActive || (player.timeLeft ?? 0) <= 0) return;
    const start = getServerTime();
    const deadline = start + (player.timeLeft ?? 0);
    let raf: number;
    const tick = () => {
      const remaining = Math.max(deadline - getServerTime(), 0);
      setTimeLeft(remaining);
      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player.isActive, player.timeLeft]);

  const totalTime = totalTimeRef.current;
  const progress = totalTime > 0 ? timeLeft / totalTime : 1;

  const ring = POSITION_RING[player.pos ?? ''];
  const baseRingColor = ring?.color ?? 'rgba(255,255,255,0.4)';
  const ringColor = player.isActive ? 'rgba(255,255,255,0.9)' : baseRingColor;

  const avatarRingStyle: CSSProperties = {
    // @ts-expect-error These may be read by PlayerAvatar
    '--ring-color': ringColor,
  };

  const progressStyle: CSSProperties = {
    transform: `scale(${progress})`,
    opacity: progress,
  };

  return (
    <div
      className="w-full flex justify-center transition-transform"
      style={progressStyle}
    >
      <PlayerAvatar
        player={player}
        pos={player.pos}
        wrapperClass={[
          'transition-transform',
          player.isActive ? 'scale-105' : '',
          winPulse ? 'winner-pulse' : '',
        ].join(' ')}
        avatarClass={avatarClass}
        avatarRingStyle={avatarRingStyle}
      />
    </div>
  );
}
