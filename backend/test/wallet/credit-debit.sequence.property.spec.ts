import fc from 'fast-check';
import {
  setupFlow,
  seedDefaultAccounts,
  USER_ID,
} from './flow-test-utils';
import { applyOperation } from './apply-operations';
import {
  depositArb,
  withdrawArb,
  reserveCommitArb,
  reserveRollbackArb,
} from './operation-arbs';

jest.setTimeout(20000);

describe('WalletService credit/debit zero-sum property', () => {
  const userId = USER_ID;

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

