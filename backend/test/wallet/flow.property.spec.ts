import fc from 'fast-check';
import { runSequence } from './helpers/sequence';
import { depositArb, withdrawArb, reserveArb } from './operation-arbs';

jest.setTimeout(20000);

describe('WalletService flows idempotency', () => {
  const opArb = fc.oneof(
    depositArb(100),
    withdrawArb(100),
    reserveArb(100),
  );

  it('maintains zero-sum and is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const sequence = await runSequence(ops);
        try {
          await sequence.apply();
          const journalCount = await sequence.journalRepo.count();
          const settlementCount = await sequence.settleRepo.count();
          const balances = {
            user: sequence.accounts.user.balance,
            reserve: sequence.accounts.reserve.balance,
            house: sequence.accounts.house.balance,
            rake: sequence.accounts.rake.balance,
            prize: sequence.accounts.prize.balance,
          };
          await sequence.apply();
          expect(await sequence.journalRepo.count()).toBe(journalCount);
          expect(await sequence.settleRepo.count()).toBe(settlementCount);
          expect(sequence.accounts.user.balance).toBe(balances.user);
          expect(sequence.accounts.reserve.balance).toBe(balances.reserve);
          expect(sequence.accounts.house.balance).toBe(balances.house);
          expect(sequence.accounts.rake.balance).toBe(balances.rake);
          expect(sequence.accounts.prize.balance).toBe(balances.prize);
          expect(sequence.total()).toBe(0);
        } finally {
          await sequence.cleanup();
        }
      }),
      { numRuns: 25 },
    );
  });
});

