import type { Player } from './types';

export interface SidePotResult {
  main: number;
  sidePots: number[];
}

export default function calculateSidePots(
  players: Player[],
  pot: number,
): SidePotResult {
  const commitments = players
    .map((p) => p.committed ?? 0)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  const layers: number[] = [];
  let prev = 0;
  let remaining = commitments.length;

  for (let i = 0; i < commitments.length; i++) {
    const diff = commitments[i] - prev;
    if (diff > 0 && remaining > 1) {
      layers.push(diff * remaining);
      prev = commitments[i];
    }
    remaining--;
  }

  const sidePots = layers.slice(1);
  const sideTotal = sidePots.reduce((a, b) => a + b, 0);
  const main = pot - sideTotal;

  return { main, sidePots };
}
