import { computeTierProgress } from '../tierProgress';
import type { Tier } from '@shared/types';

describe('computeTierProgress', () => {
  const tiers: Tier[] = [
    { name: 'Bronze', min: 0, max: 999 },
    { name: 'Silver', min: 1000, max: 4999 },
    { name: 'Gold', min: 5000, max: null },
  ];

  it('returns tier name, next target, and percent for intermediate tier', () => {
    const result = computeTierProgress(tiers, 1500);
    expect(result).toEqual({
      name: 'Silver',
      current: 1500,
      next: 5000,
      percent: 13,
    });
  });

  it('caps percent at 100 for the highest tier', () => {
    const result = computeTierProgress(tiers, 6000);
    expect(result).toEqual({
      name: 'Gold',
      current: 6000,
      next: 6000,
      percent: 100,
    });
  });

  it('returns null when tiers are unavailable', () => {
    expect(computeTierProgress([], 1500)).toBeNull();
  });
});
