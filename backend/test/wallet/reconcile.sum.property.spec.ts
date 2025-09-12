import fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import {
  createWalletTestContext,
  reconcileSum,
} from './test-utils';
import { USER_ID, opArb } from './property-utils';

jest.setTimeout(20000);

describe('WalletService.reconcile zero-sum property', () => {
  it('reconciliation sums always to zero', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const ctx = await createWalletTestContext();
        try {
          await ctx.repos.account.save([
            { id: USER_ID, name: 'user', balance: 0, currency: 'USD' },
            {
              id: '00000000-0000-0000-0000-000000000001',
              name: 'reserve',
              balance: 0,
              currency: 'USD',
            },
            {
              id: '00000000-0000-0000-0000-000000000002',
              name: 'house',
              balance: 0,
              currency: 'USD',
            },
            {
              id: '00000000-0000-0000-0000-000000000003',
              name: 'rake',
              balance: 0,
              currency: 'USD',
            },
            {
              id: '00000000-0000-0000-0000-000000000004',
              name: 'prize',
              balance: 0,
              currency: 'USD',
            },
          ]);
          for (const op of ops) {
            switch (op.type) {
              case 'reserve':
                await ctx.service.reserve(USER_ID, op.amount, op.ref, 'USD');
                break;
              case 'commit':
                await ctx.service.commit(op.ref, op.amount, op.rake, 'USD');
                break;
              case 'rollback':
                await ctx.service.rollback(USER_ID, op.amount, op.ref, 'USD');
                break;
            }
          }
          const { report, total } = await reconcileSum(ctx.service);
          if (report.length > 0 || total !== 0) {
            const dir = path.join(__dirname, '../../../storage');
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(
              path.join(dir, 'wallet-reconcile-failure.json'),
              JSON.stringify({ ops, report, total }, null, 2),
            );
          }
          expect(total).toBe(0);
          expect(report).toHaveLength(0);
        } finally {
          await ctx.dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

