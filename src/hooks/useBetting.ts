'use client';

import { useState } from 'react';
import type { Player } from '@/app/components/tables/types';

interface UseBettingOptions {
  players: Player[];
  communityCards: string[];
  pot: number;
  bigBlind: number;
  heroId?: Player['id'];
  heroUsername?: Player['username'];
}

export default function useBetting({
  players,
  communityCards,
  pot: basePot,
  bigBlind,
  heroId,
  heroUsername,
}: UseBettingOptions) {
  const hero =
    heroId != null
      ? players.find((p) => p.id === heroId)
      : heroUsername != null
        ? players.find((p) => p.username === heroUsername)
        : undefined;
  const youChips = hero?.chips ?? players[0]?.chips ?? 0;

  const commitments = players.map((p) => p.committed ?? 0);
  const currentBet = Math.max(0, ...commitments);
  const sorted = [...commitments].sort((a, b) => b - a);
  const previousBetTo = sorted[1] ?? 0;
  const heroCommitted = hero?.committed ?? 0;
  const callAmount = Math.max(0, currentBet - heroCommitted);

  const street: 'pre' | 'flop' | 'turn' | 'river' =
    communityCards.length === 0
      ? 'pre'
      : communityCards.length === 3
        ? 'flop'
        : communityCards.length === 4
          ? 'turn'
          : 'river';

  const lastRaiseSize = Math.max(bigBlind, currentBet - previousBetTo);
  const minOpenTo = bigBlind;
  const minTotal = callAmount > 0 ? currentBet + lastRaiseSize : minOpenTo;

  const pot = basePot + commitments.reduce((a, b) => a + b, 0);

  const heroBehind = hero?.chips ?? 0;
  const maxOppBehind = Math.max(
    0,
    ...players.filter((p) => p.id !== hero?.id).map((p) => p.chips ?? 0),
  );
  const effective = Math.min(heroBehind, maxOppBehind);

  const maxTotal = Math.max(minTotal, heroCommitted + effective);

  const [raiseTotal, setRaiseTotal] = useState<number>(
    Math.max(minTotal, currentBet || minOpenTo),
  );

  return {
    hero,
    youChips,
    currentBet,
    callAmount,
    street,
    pot,
    minTotal,
    maxTotal,
    effective,
    raiseTotal,
    setRaiseTotal,
  } as const;
}
