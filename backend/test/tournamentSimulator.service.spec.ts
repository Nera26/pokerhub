import {
  simulate,
  mean,
  variance,
  type BlindLevel,
  type BotProfile,
} from '@shared/utils/tournamentSimulator';

describe('tournamentSimulator service', () => {
  it('computes mean and variance', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(variance([1, 2, 3])).toBeCloseTo(2 / 3);
  });

  it('handles small entrant counts', () => {
    const structure: BlindLevel[] = [
      { level: 1, durationMinutes: 1, blindMultiplier: 1 },
    ];
    const profiles: BotProfile[] = [
      { name: 'test', proportion: 1, bustMultiplier: 1 },
    ];
    const res = simulate(structure, 2, 1, profiles);
    expect(res).toEqual({ averageDuration: 1, durationVariance: 0 });
  });

  it('handles varied blind structures', () => {
    const structure: BlindLevel[] = [
      { level: 1, durationMinutes: 2, blindMultiplier: 1 },
      { level: 2, durationMinutes: 3, blindMultiplier: 2 },
    ];
    const profiles: BotProfile[] = [
      { name: 'p', proportion: 1, bustMultiplier: 1 },
    ];
    const res = simulate(structure, 10, 2, profiles);
    expect(res.averageDuration).toBeGreaterThan(0);
    expect(res.durationVariance).toBeGreaterThanOrEqual(0);
  });

  it('respects bust multipliers from profiles', () => {
    const structure: BlindLevel[] = [
      { level: 1, durationMinutes: 1, blindMultiplier: 1 },
      { level: 2, durationMinutes: 1, blindMultiplier: 1 },
      { level: 3, durationMinutes: 1, blindMultiplier: 1 },
    ];
    const slow: BotProfile[] = [
      { name: 'slow', proportion: 1, bustMultiplier: 0.5 },
    ];
    const fast: BotProfile[] = [
      { name: 'fast', proportion: 1, bustMultiplier: 2 },
    ];
    const slowRes = simulate(structure, 100, 1, slow);
    const fastRes = simulate(structure, 100, 1, fast);
    expect(fastRes.averageDuration).toBeLessThan(slowRes.averageDuration);
  });
});
