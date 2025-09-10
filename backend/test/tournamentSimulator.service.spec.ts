import { simulate, mean, variance, BlindLevel } from '../src/services/tournamentSimulator';

describe('tournamentSimulator service', () => {
  it('computes mean and variance', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(variance([1, 2, 3])).toBeCloseTo(2 / 3);
  });

  it('handles small entrant counts', () => {
    const structure: BlindLevel[] = [
      { level: 1, durationMinutes: 1, blindMultiplier: 1 },
    ];
    const res = simulate(structure, 2, 1);
    expect(res).toEqual({ averageDuration: 1, durationVariance: 0 });
  });

  it('handles varied blind structures', () => {
    const structure: BlindLevel[] = [
      { level: 1, durationMinutes: 2, blindMultiplier: 1 },
      { level: 2, durationMinutes: 3, blindMultiplier: 2 },
    ];
    const res = simulate(structure, 10, 2);
    expect(res.averageDuration).toBeGreaterThan(0);
    expect(res.durationVariance).toBeGreaterThanOrEqual(0);
  });
});
