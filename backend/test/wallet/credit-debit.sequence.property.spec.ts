import fc from 'fast-check';
import {
  setupFlow,
  seedDefaultAccounts,
  USER_ID,
} from './flow-test-utils';
import { applyOperation } from './apply-operations';

jest.setTimeout(20000);

describe('WalletService credit/debit zero-sum property', () => {
  const userId = USER_ID;

  const intArb = fc.integer({ min: 1, max: 1_000_000_000 });
  const depositArb = fc.record({
    type: fc.constant<'deposit'>('deposit'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const withdrawArb = fc.record({
    type: fc.constant<'withdraw'>('withdraw'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const reserveCommitArb = intArb.chain((amount) =>
    fc.record({
      type: fc.constant<'reserveCommit'>('reserveCommit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
      idempotencyKey: fc.hexaString({ minLength: 1, maxLength: 10 }),
    }),
  );
  const reserveRollbackArb = fc.record({
    type: fc.constant<'reserveRollback'>('reserveRollback'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
    idempotencyKey: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const opArb = fc.oneof(depositArb, withdrawArb, reserveCommitArb, reserveRollbackArb);
  const batchArb = fc.array(fc.array(opArb, { minLength: 1, maxLength: 3 }), { maxLength: 5 });

  it('maintains zero-sum across accounts', async () => {
    await fc.assert(
      fc.asyncProperty(batchArb, async (batches) => {
        const { dataSource, service, accountRepo } = await setupFlow();
        const accounts = await seedDefaultAccounts(accountRepo);
        try {
          for (const batch of batches) {
            await Promise.all(
              batch.map((op) =>
                applyOperation(service, accounts, userId, op),
              ),
            );
          }
          const total =
            accounts.user.balance +
            accounts.reserve.balance +
            accounts.house.balance +
            accounts.rake.balance +
            accounts.prize.balance;
          expect(total).toBe(0);
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

