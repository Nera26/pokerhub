import fc from 'fast-check';
import { setupFlow, seedDefaultAccounts, USER_ID } from './flow-test-utils';
import { applyOperation } from './apply-operations';
import { depositArb, withdrawArb, reserveArb } from './operation-arbs';

jest.setTimeout(20000);

describe('WalletService flows idempotency', () => {
  const userId = USER_ID;

  const opArb = fc.oneof(
    depositArb(100),
    withdrawArb(100),
    reserveArb(100),
  );

  it('maintains zero-sum and is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, accountRepo, journalRepo, settleRepo } =
          await setupFlow();
        const accounts = await seedDefaultAccounts(accountRepo);
        try {
          const apply = async () => {
            for (const op of ops) {
              await applyOperation(service, accounts, userId, op);
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

