import fc from 'fast-check';
import { shuffle, standardDeck } from '../../src/game/rng';

describe('shuffle uniformity', () => {
  it('distributes each card roughly uniformly across positions', () => {
    const deck = standardDeck();
    const samples = 1000;

    const property = fc.property(
      fc.array(fc.uint8Array({ minLength: 32, maxLength: 32 }), {
        minLength: samples,
        maxLength: samples,
      }),
      (seeds) => {
        const counts = Array.from({ length: deck.length }, () =>
          Array(deck.length).fill(0),
        );

        seeds.forEach((seed) => {
          const shuffled = shuffle(deck, Buffer.from(seed));
          shuffled.forEach((card, idx) => {
            counts[idx][card] += 1;
          });
        });

        const expected = samples / deck.length;
        const threshold = 120; // ~7 sigma above expectation for df=51

        counts.forEach((positionCounts) => {
          const chiSq = positionCounts.reduce(
            (sum, obs) => sum + Math.pow(obs - expected, 2) / expected,
            0,
          );
          expect(chiSq).toBeLessThan(threshold);
        });
      },
    );

    fc.assert(property, { numRuns: 1 });
  });
});
