import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { icmRaw } from '../../src/tournament/structures/icm';

describe('ICM payout accuracy', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    new RebuyService(),
    new PkoService(),
    { get: jest.fn() } as any,
  );

  function icmHelper(stacks: number[], payouts: number[]): number[] {
    return icmRaw(stacks, payouts);
  }

  for (let entrants = 2; entrants <= 6; entrants++) {
    it(`matches ICM library for ${entrants} entrants`, () => {
      const stacks = Array.from({ length: entrants }, (_, i) => (i + 1) * 1000);
      const prizePositions = Math.min(entrants, 3);
      const payouts = Array.from(
        { length: prizePositions },
        (_, i) => (prizePositions - i) * 100,
      );
      const prizePool = payouts.reduce((a, b) => a + b, 0);

      const result = service.calculatePrizes(prizePool, payouts, {
        method: 'icm',
        stacks,
      });
      const expected = icmHelper(stacks, payouts);

      expect(result.prizes).toHaveLength(entrants);
      for (let i = 0; i < entrants; i++) {
        expect(Math.abs(result.prizes[i] - expected[i])).toBeLessThan(1);
      }
    });
  }
});

