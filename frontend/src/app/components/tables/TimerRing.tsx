'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTableTheme } from '@/hooks/useTableTheme';
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

  const { data, isLoading, isError } = useTableTheme();
  if (isLoading) {
    return <div>Loading table theme...</div>;
  }
  if (isError || !data) {
    return <div>Failed to load theme</div>;
  }
  const positions = data.positions;

  useEffect(() => {
    totalTimeRef.current = player.timeLeft ?? 0;
    setTimeLeft(player.timeLeft ?? 0);
  }, [player.timeLeft]);

  useEffect(() => {
    if (!player.isActive || (player.timeLeft ?? 0) <= 0) return;

    const start = getServerTime();
    const deadline = start + (player.timeLeft ?? 0);

    let raf = requestAnimationFrame(function tick() {
      const now = getServerTime();
      const remaining = Math.max(deadline - now, 0);
      setTimeLeft(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, [player.isActive, player.timeLeft]);

  const totalTime = totalTimeRef.current;
  const progress =
    totalTime > 0 ? Math.max(0, Math.min(1, timeLeft / totalTime)) : 1;

  const ring = positions[player.pos ?? ''];
  const baseRingColor = ring?.color ?? 'rgba(255,255,255,0.4)';
  const ringColor = player.isActive ? 'rgba(255,255,255,0.9)' : baseRingColor;

  const avatarRingStyle: CSSProperties = {
    // Expose CSS var consumed by PlayerAvatar's SVG ring
    ...({ ['--ring-color']: ringColor } as any),
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
        ]
          .filter(Boolean)
          .join(' ')}
        avatarClass={avatarClass}
        avatarRingStyle={avatarRingStyle}
      />
    </div>
  );
}
