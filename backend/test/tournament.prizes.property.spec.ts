import fc from 'fast-check';
import { calculateIcmPayouts, icmRaw } from '../src/tournament/structures/icm';
import { TournamentService } from '../src/tournament/tournament.service';

describe('tournament prizes property', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('matches top-N ICM and avoids moving players twice within N hands', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 3, maxLength: 9 }),
        fc.array(fc.integer({ min: 1, max: 500 }), { minLength: 1, maxLength: 9 }),
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 2, max: 20 }),
        (stacks, prizeSeeds, tableCount, avoidWithin) => {
          const numPrizes = Math.min(prizeSeeds.length, stacks.length);
          const prizes = prizeSeeds.slice(0, numPrizes);

          // set up players and tables
          const players = stacks.map((_, i) => `p${i}`);
          const tables: string[][] = Array.from({ length: tableCount }, () => []);
          players.forEach((id, idx) => tables[idx % tableCount].push(id));

          const recentlyMoved = new Map<string, number>();
          const currentStacks = stacks.slice();
          const currentPlayers = players.slice();
          let hand = 0;

          // simulate bustouts until top-N remain
          while (currentPlayers.length > numPrizes) {
            // eliminate smallest stack
            let elimIdx = 0;
            for (let i = 1; i < currentStacks.length; i++) {
              if (currentStacks[i] < currentStacks[elimIdx]) elimIdx = i;
            }
            const elimId = currentPlayers[elimIdx];
            currentPlayers.splice(elimIdx, 1);
            currentStacks.splice(elimIdx, 1);
            for (const t of tables) {
              const pos = t.indexOf(elimId);
              if (pos !== -1) t.splice(pos, 1);
            }

            // rebalance and ensure movement window respected
            const beforeIdx = new Map<string, number>();
            tables.forEach((tbl, idx) => tbl.forEach((p) => beforeIdx.set(p, idx)));
            const beforeMoved = new Map(recentlyMoved);
            const balanced = service.balanceTables(
              tables,
              recentlyMoved,
              hand,
              avoidWithin,
            );
            tables.length = 0;
            for (const b of balanced) tables.push([...b]);
            balanced.forEach((tbl, idx) => {
              for (const p of tbl) {
                const prev = beforeIdx.get(p);
                if (prev !== undefined && prev !== idx) {
                  const last = beforeMoved.get(p) ?? -Infinity;
                  expect(hand - last).toBeGreaterThan(avoidWithin);
                }
              }
            });
            hand++;
          }

          const finalStacks = currentStacks;
          const expected = calculateIcmPayouts(finalStacks, prizes);
          const raw = icmRaw(finalStacks, prizes);
          for (let i = 0; i < expected.length; i++) {
            expect(Math.abs(raw[i] - expected[i])).toBeLessThan(1);
          }
        },
      ),
      { numRuns: 30 },
    );
  });
});
