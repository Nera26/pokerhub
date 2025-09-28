import { createTournamentServiceInstance } from './helpers';

describe('Payout distribution', () => {
  const service = createTournamentServiceInstance();

  it('ICM pays all remaining players compared to top-N', () => {
    const stacks = [5000, 3000, 2000, 1000];
    const topN = service.calculatePrizes(200, [0.5, 0.3, 0.2]);
    expect(topN.prizes).toEqual([100, 60, 40]);

    const icm = service.calculatePrizes(200, [100, 60, 40], {
      method: 'icm',
      stacks,
    });
    expect(icm.prizes).toHaveLength(4);
    expect(icm.prizes[3]).toBeGreaterThan(0);
    expect(icm.prizes.reduce((a, b) => a + b, 0)).toBe(200);
  });
});
