import * as fc from 'fast-check';
import {
  setupWalletTest,
  WalletTestContext,
  seedWalletAccounts,
  assertLedgerInvariant,
} from './test-utils';

describe('WalletService reserve/commit/rollback flow', () => {
  let ctx: WalletTestContext;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ctx = await setupWalletTest();
    await seedWalletAccounts(ctx.repos.account);
  });

  afterAll(async () => {
    await ctx.repos.dataSource.destroy();
  });

  it('reserves, commits part and rolls back remainder', async () => {
    const ref = 'hand#1';
    await ctx.service.reserve(userId, 100, ref, 'USD');
    await ctx.service.commit(ref, 60, 5, 'USD');
    await ctx.service.rollback(userId, 40, ref, 'USD');

    const repo = ctx.repos.account;
    const user = await repo.findOneByOrFail({ id: userId });
    const reserve = await repo.findOneByOrFail({ name: 'reserve' });
    const prize = await repo.findOneByOrFail({ name: 'prize' });
    const rake = await repo.findOneByOrFail({ name: 'rake' });
    expect(user.balance).toBe(940);
    expect(reserve.balance).toBe(0);
    expect(prize.balance).toBe(55);
    expect(rake.balance).toBe(5);
  });

  it('cancels reservation when rolled back before commit', async () => {
    const ref = 'hand#2';
    const key = 'hand#flop#0';
    const accountRepo = ctx.repos.account;
    const userBefore = await accountRepo.findOneByOrFail({ id: userId });
    const reserveBefore = await accountRepo.findOneByOrFail({ name: 'reserve' });
    await ctx.service.reserve(userId, 50, ref, 'USD', key);
    await ctx.service.rollback(userId, 50, ref, 'USD', key);
    const userAfter = await accountRepo.findOneByOrFail({ id: userId });
    const reserveAfter = await accountRepo.findOneByOrFail({ name: 'reserve' });
    expect(userAfter.balance).toBe(userBefore.balance);
    expect(reserveAfter.balance).toBe(reserveBefore.balance);
    const entry = await ctx.repos.settlement.findOne({ where: { idempotencyKey: key } });
    expect(entry).toBeNull();
  });

  it(
    'maintains balance and journal invariants under random batches',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              reserve: fc.integer({ min: 1, max: 100 }),
              commit: fc.integer({ min: 0, max: 100 }),
              rake: fc.integer({ min: 0, max: 100 }),
            }).filter((t) => t.commit <= t.reserve && t.rake <= t.commit),
            { maxLength: 10 },
          ),
          async (batch) => {
            const accountRepo = ctx.repos.account;
            const journalRepo = ctx.repos.journal;

            await journalRepo.clear();
            const accounts = await accountRepo.find();
            for (const acc of accounts) {
              acc.balance = 0;
            }
            await accountRepo.save(accounts);

            for (let i = 0; i < batch.length; i++) {
              const t = batch[i];
              const refId = `hand#${i}`;
              await ctx.service.reserve(userId, t.reserve, refId, 'USD');
              await ctx.service.commit(refId, t.commit, t.rake, 'USD');
              const rollbackAmt = t.reserve - t.commit;
              if (rollbackAmt > 0) {
                await ctx.service.rollback(userId, rollbackAmt, refId, 'USD');
              }
            }
            await assertLedgerInvariant(ctx.service);
          },
        ),
        { numRuns: 25 },
      );
    },
    20000,
  );

  it('reports credit balance separately', async () => {
    const repo = ctx.repos.account;
    const accountId = '22222222-2222-2222-2222-222222222222';
    await repo.save({
      id: accountId,
      name: 'creditUser',
      balance: 150,
      creditBalance: 50,
      currency: 'EUR',
    });
    const status = await ctx.service.status(accountId);
    expect(status).toEqual({
      kycVerified: false,
      denialReason: undefined,
      realBalance: 100,
      creditBalance: 50,
      currency: 'EUR',
    });
    const tx = await ctx.service.transactions(accountId);
    expect(tx.realBalance).toBe(100);
    expect(tx.creditBalance).toBe(50);
    expect(tx.transactions).toHaveLength(0);
    const pending = await ctx.service.pending(accountId);
    expect(pending.realBalance).toBe(100);
    expect(pending.creditBalance).toBe(50);
    expect(pending.transactions).toHaveLength(0);
  });
});
