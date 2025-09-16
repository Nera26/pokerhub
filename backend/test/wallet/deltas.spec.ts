import fc from 'fast-check';
import { assertBalance } from './helpers/assertBalance';
import { setupPropertyTest, opArb, USER_ID } from './property-utils';

jest.setTimeout(20000);

describe('WalletService transaction deltas', () => {
  it('sums deltas to zero for any transaction batch', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, journalRepo } = await setupPropertyTest();
        try {
          await assertBalance({
            service,
            ops,
            userId: USER_ID,
            expected: 0,
            getBalance: async (op) => {
              const entries = await journalRepo.find({
                where: { refType: op.type, refId: op.ref },
              });
              return entries.reduce((sum, e) => sum + Number(e.amount), 0);
            },
          });
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
