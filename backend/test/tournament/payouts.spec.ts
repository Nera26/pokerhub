import fc from 'fast-check';
import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { icmRaw } from '../../src/tournament/structures/icm';

describe('tournament calculatePrizes property', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    new RebuyService(),
    new PkoService(),
    { get: jest.fn().mockResolvedValue(true) } as any,
  );

  it('conserves prize pool and limits rounding error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 5 }),
        fc.boolean(),
        fc.option(fc.double({ min: 0, max: 0.5, noNaN: true }), { nil: undefined }),
        fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: 1, maxLength: 9 }),
        (
          prizePool,
          payoutSeeds,
          useIcm,
          bountyPctOpt,
          seatCostOpt,
          stacks,
        ) => {
          const opts: any = {};
          let pool = prizePool;
          if (bountyPctOpt !== undefined) {
            opts.bountyPct = bountyPctOpt;
            const bountyPool = Math.floor(pool * bountyPctOpt);
            pool -= bountyPool;
          }
          if (seatCostOpt !== undefined) {
            opts.satelliteSeatCost = seatCostOpt;
            const seats = Math.floor(pool / seatCostOpt);
            pool -= seats * seatCostOpt;
          }

          let payouts: number[];
          let expected: number[];
          if (useIcm && stacks.length > 0) {
            const payLen = Math.min(payoutSeeds.length, stacks.length);
            const seeds = payoutSeeds.slice(0, payLen);
            const sumSeeds = seeds.reduce((a, b) => a + b, 0);
            payouts = seeds.map((s) => Math.floor((s * pool) / sumSeeds));
            let rem = pool - payouts.reduce((a, b) => a + b, 0);
            for (let i = 0; i < rem; i++) payouts[i % payouts.length] += 1;
            opts.method = 'icm';
            opts.stacks = stacks.slice(0, payLen);
            expected = icmRaw(opts.stacks, payouts);
          } else {
            const sumSeeds = payoutSeeds.reduce((a, b) => a + b, 0);
            payouts = payoutSeeds.map((s) => s / sumSeeds);
            expected = payouts.map((p) => pool * p);
          }

          const res = service.calculatePrizes(prizePool, payouts, opts);
          const total =
            res.prizes.reduce((a, b) => a + b, 0) +
            (res.bountyPool ?? 0) +
            (res.remainder ?? 0) +
            (res.seats ?? 0) * (opts.satelliteSeatCost ?? 0);
          expect(total).toBe(prizePool);

          for (let i = 0; i < res.prizes.length; i++) {
            expect(Math.abs(res.prizes[i] - expected[i])).toBeLessThan(1);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
