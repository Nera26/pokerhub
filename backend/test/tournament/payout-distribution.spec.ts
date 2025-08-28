import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';

describe('Payout distribution', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn() } as any,
    new RebuyService(),
    new PkoService(),
  );

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
