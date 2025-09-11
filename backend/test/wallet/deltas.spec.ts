import fc from 'fast-check';
import { setupPropertyTest, opArb, USER_ID } from './property-utils';

jest.setTimeout(20000);

describe('WalletService transaction deltas', () => {
  it('sums deltas to zero for any transaction batch', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, journalRepo } = await setupPropertyTest();
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
            const entries = await journalRepo.find({
              where: { refType: op.type, refId: op.ref },
            });
            const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
            expect(total).toBe(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
