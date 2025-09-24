import type { Tier } from '@shared/types';

export interface TierProgress {
  name: string;
  current: number;
  next: number;
  percent: number;
}

export function computeTierProgress(
  tiers: Tier[],
  experience: number,
): TierProgress | null {
  if (!tiers.length) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  const currentIndex = sorted.findIndex((tier, index) => {
    const next = sorted[index + 1];
    const upperBound = tier.max ?? next?.min ?? Number.POSITIVE_INFINITY;
    return experience >= tier.min && experience <= upperBound;
  });

  const indexToUse =
    currentIndex === -1 ? Math.max(sorted.length - 1, 0) : currentIndex;
  const currentTier = sorted[indexToUse];
  const nextTier = sorted[indexToUse + 1];

  const target =
    currentTier.max === null
      ? experience
      : (nextTier?.min ?? currentTier.max ?? experience);

  let percent = 100;
  if (currentTier.max === null) {
    percent = 100;
  } else if (nextTier) {
    const range = nextTier.min - currentTier.min;
    if (range > 0) {
      const progress = experience - currentTier.min;
      percent = Math.round((progress / range) * 100);
    }
  } else if (currentTier.max > currentTier.min) {
    const range = currentTier.max - currentTier.min;
    const clamped = Math.min(
      Math.max(experience, currentTier.min),
      currentTier.max,
    );
    percent = Math.round(((clamped - currentTier.min) / range) * 100);
  }

  percent = Math.min(100, Math.max(0, percent));

  return {
    name: currentTier.name,
    current: experience,
    next: Math.max(target, experience),
    percent,
  };
}
