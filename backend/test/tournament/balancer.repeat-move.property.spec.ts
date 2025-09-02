import fc from 'fast-check';
import { TableBalancerService } from '../../src/tournament/table-balancer.service';
import { TournamentService } from '../../src/tournament/tournament.service';

describe('table balancer repeat move property', () => {
  const realTournament = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('avoids moving the same player twice within N hands', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 9 }), { minLength: 2, maxLength: 5 }),
        fc.integer({ min: 1, max: 20 }),
        fc.array(fc.nat(20), { minLength: 1, maxLength: 20 }),
        async (sizes, avoidWithin, eliminations) => {
          const total = sizes.reduce((a, b) => a + b, 0);
          const ids = Array.from({ length: total }, (_, i) => `p${i}`);
          const tables: string[][] = sizes.map((s) => ids.splice(0, s));
          const seatLastMoved = new Map<string, number>();

          const repo = {
            find: async () =>
              tables.map((t) => ({
                seats: t.map((p) => ({
                  user: { id: p },
                  lastMovedHand: seatLastMoved.get(p) ?? 0,
                })),
              })),
          } as any;

          const balancer = new TableBalancerService(
            repo,
            {
              detectBubble: async () => {},
              balanceTournament: async (
                _tid: string,
                hand: number,
                avoid: number,
                recentlyMoved: Map<string, number>,
              ) => {
                const balanced = realTournament.balanceTables(
                  tables,
                  recentlyMoved,
                  hand,
                  avoid,
                );
                tables.length = 0;
                for (const b of balanced) tables.push([...b]);
              },
            } as any,
          );

          const lastMoved = new Map<string, number>();
          for (let hand = 0; hand < eliminations.length; hand++) {
            if (tables.flat().length <= 1) break;
            const idx = eliminations[hand] % tables.length;
            if (tables[idx].length === 0) continue;
            tables[idx].pop();
            const before = tables.map((t) => [...t]);
            const rebalanced = await balancer.rebalanceIfNeeded(
              't',
              hand,
              avoidWithin,
            );
            if (rebalanced) {
              for (let i = 0; i < before.length; i++) {
                for (const p of before[i]) {
                  const afterIdx = tables.findIndex((t) => t.includes(p));
                  if (afterIdx !== -1 && afterIdx !== i) {
                    const last = lastMoved.get(p) ?? -Infinity;
                    expect(hand - last).toBeGreaterThanOrEqual(avoidWithin);
                    lastMoved.set(p, hand);
                    seatLastMoved.set(p, hand);
                  }
                }
              }
            }
          }
        },
      ),
      { numRuns: 30 },
    );
  });
});

