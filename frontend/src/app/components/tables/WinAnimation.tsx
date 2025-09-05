'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import ConfettiBurst from './ConfettiBurst';
import { useChipAnimator } from './ChipAnimator';
import type { Player } from './types';

interface WinAnimationProps {
  player: Player;
  children: (winPulse: boolean) => ReactNode;
}

export default function WinAnimation({ player, children }: WinAnimationProps) {
  const { animateWin } = useChipAnimator();
  const prevChips = useRef(player.chips);
  const prevWinner = useRef<boolean | undefined>(player.isWinner);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [showGlow, setShowGlow] = useState(false);
  const [winPulse, setWinPulse] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout | undefined;
    if (player.isWinner && !prevWinner.current) {
      const delta = Math.max(player.chips - prevChips.current, 0);
      if (delta > 0) animateWin(player.id, delta);
      setCelebrateKey((k) => k + 1);
      setShowGlow(true);
      setWinPulse(true);
      t = setTimeout(() => {
        setShowGlow(false);
        setWinPulse(false);
      }, 1000);
    } else if (!player.isWinner) {
      setWinPulse(false);
    }
    prevChips.current = player.chips;
    prevWinner.current = player.isWinner;
    return () => {
      if (t) clearTimeout(t);
    };
  }, [player.isWinner, player.chips, player.id, animateWin]);

  return (
    <div className="relative">
      {children(winPulse)}
      {showGlow && (
        <span className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-yellow-300 opacity-70 animate-ping" />
      )}
      <ConfettiBurst triggerKey={celebrateKey} />
    </div>
  );
}
