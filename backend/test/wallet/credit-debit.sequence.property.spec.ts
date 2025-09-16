import fc from 'fast-check';
import { runSequence } from './helpers/sequence';
import {
  depositArb,
  withdrawArb,
  reserveCommitArb,
  reserveRollbackArb,
} from './operation-arbs';

jest.setTimeout(20000);

describe('WalletService credit/debit zero-sum property', () => {
  const opArb = fc.oneof(
    depositArb(),
    withdrawArb(),
    reserveCommitArb(),
    reserveRollbackArb(),
  );
  const batchArb = fc.array(
    fc.array(opArb, { minLength: 1, maxLength: 3 }),
    { maxLength: 5 },
  );

  it('maintains zero-sum across accounts', async () => {
    await fc.assert(
      fc.asyncProperty(batchArb, async (batches) => {
        const sequence = await runSequence(batches);
        try {
          await sequence.apply();
          expect(sequence.total()).toBe(0);
        } finally {
          await sequence.cleanup();
        }
      }),
      { numRuns: 25 },
    );
  });
});

