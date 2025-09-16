import fc from 'fast-check';
import { assertBalance } from './helpers/assertBalance';
import { setupPropertyTest, opArb, USER_ID } from './property-utils';

jest.setTimeout(20000);

describe('WalletService balance invariants', () => {
  it('preserves total balance for random transaction batches', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service } = await setupPropertyTest();
        const initial = await service.totalBalance();
        try {
          await assertBalance({
            service,
            ops,
            userId: USER_ID,
            expected: initial,
            getBalance: () => service.totalBalance(),
          });
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
