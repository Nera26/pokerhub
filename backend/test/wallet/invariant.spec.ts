import fc from 'fast-check';
import { setupPropertyTest, opArb, USER_ID } from './property-utils';

jest.setTimeout(20000);

describe('WalletService balance invariants', () => {
  it('preserves total balance for random transaction batches', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service } = await setupPropertyTest();
        const initial = await service.totalBalance();
        try {
          for (const op of ops) {
            switch (op.type) {
              case 'reserve':
                await service.reserve(USER_ID, op.amount, op.ref, 'USD');
                break;
              case 'commit':
                await service.commit(op.ref, op.amount, op.rake, 'USD');
                break;
              case 'rollback':
                await service.rollback(USER_ID, op.amount, op.ref, 'USD');
                break;
            }
            const total = await service.totalBalance();
            expect(total).toBe(initial);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
