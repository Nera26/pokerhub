import fc from 'fast-check';
import {
  createFlowTestContext,
  seedDefaultAccounts,
  USER_ID,
} from './flow-test-utils';

jest.setTimeout(20000);

describe('WalletService flows idempotency', () => {
  const userId = USER_ID;

  const depositArb = fc.record({
    type: fc.constant<'deposit'>('deposit'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });

  const withdrawArb = fc.record({
    type: fc.constant<'withdraw'>('withdraw'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });

  const reserveArb = fc.integer({ min: 1, max: 100 }).chain((amount) =>
    fc.record({
      type: fc.constant<'reserve'>('reserve'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
      idempotencyKey: fc.hexaString({ minLength: 1, maxLength: 10 }),
    }),
  );

  const opArb = fc.oneof(depositArb, withdrawArb, reserveArb);

  it('maintains zero-sum and is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, accountRepo, journalRepo, settleRepo } =
          await createFlowTestContext();
        const accounts = await seedDefaultAccounts(accountRepo);
        try {
          const apply = async () => {
            for (const op of ops) {
              switch (op.type) {
                case 'deposit':
                  await (service as any).record('deposit', op.ref, [
                    { account: accounts.house, amount: -op.amount },
                    { account: accounts.user, amount: op.amount },
                  ]);
                  break;
                case 'withdraw':
                  await (service as any).record('withdraw', op.ref, [
                    { account: accounts.user, amount: -op.amount },
                    { account: accounts.house, amount: op.amount },
                  ]);
                  break;
                case 'reserve':
                  await service.reserve(userId, op.amount, op.ref, 'USD', op.idempotencyKey);
                  await service.commit(op.ref, op.amount, op.rake, 'USD', op.idempotencyKey);
                  break;
              }
            }
          };
          await apply();
          const journalCount = await journalRepo.count();
          const settlementCount = await settleRepo.count();
          const balances = {
            user: accounts.user.balance,
            reserve: accounts.reserve.balance,
            house: accounts.house.balance,
            rake: accounts.rake.balance,
            prize: accounts.prize.balance,
          };
          await apply();
          expect(await journalRepo.count()).toBe(journalCount);
          expect(await settleRepo.count()).toBe(settlementCount);
          expect(accounts.user.balance).toBe(balances.user);
          expect(accounts.reserve.balance).toBe(balances.reserve);
          expect(accounts.house.balance).toBe(balances.house);
          expect(accounts.rake.balance).toBe(balances.rake);
          expect(accounts.prize.balance).toBe(balances.prize);
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

