import fc from 'fast-check';
import { randomUUID } from 'crypto';
import {
  createWalletTestContext,
  walletTransactionArb,
  TEST_USER_ID,
  RESERVE_ACCOUNT_ID,
} from './wallet/test-fixtures';

jest.setTimeout(20000);

describe('WalletService zero-sum property', () => {
  const userId = TEST_USER_ID;

  async function setup() {
    const context = await createWalletTestContext();
    const depositRef = randomUUID();
    await context.journalRepo.insert([
      {
        id: randomUUID(),
        accountId: userId,
        amount: 1000,
        currency: 'USD',
        refType: 'deposit',
        refId: depositRef,
        hash: randomUUID(),
      },
      {
        id: randomUUID(),
        accountId: RESERVE_ACCOUNT_ID,
        amount: -1000,
        currency: 'USD',
        refType: 'deposit',
        refId: depositRef,
        hash: randomUUID(),
      },
    ]);
    await context.accountRepo.increment({ id: userId }, 'balance', 1000);
    await context.accountRepo.increment({ id: RESERVE_ACCOUNT_ID }, 'balance', -1000);
    return context;
  }

  it('maintains zero-sum balance and consistent journals', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(walletTransactionArb, { maxLength: 5 }), async (txs) => {
        const { dataSource, service, journalRepo } = await setup();
        let expectedEntries = 2; // initial deposit
        try {
          for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const ref = `tx${i}`;
            await service.reserve(userId, tx.amount, ref, 'USD');
            await service.commit(ref, tx.amount, tx.rake, 'USD');
            await service.rollback(userId, tx.amount, ref, 'USD');
            expectedEntries += 7; // 2 reserve + 3 commit + 2 rollback
            const total = await service.totalBalance();
            expect(total).toBe(0);
            const count = await journalRepo.count();
            expect(count).toBe(expectedEntries);
            const entries = await journalRepo.find();
            expect(entries.every((e) => e.currency === 'USD')).toBe(true);
            const report = await service.reconcile();
            expect(report).toHaveLength(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
