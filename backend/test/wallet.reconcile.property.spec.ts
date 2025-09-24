import fc from 'fast-check';
import { randomUUID } from 'crypto';
import {
  createWalletTestContext,
  walletOperationArb,
  TEST_USER_ID,
  RESERVE_ACCOUNT_ID,
  HOUSE_ACCOUNT_ID,
  RAKE_ACCOUNT_ID,
  PRIZE_ACCOUNT_ID,
} from './wallet/test-fixtures';

jest.setTimeout(20000);

describe('WalletService.reconcile property', () => {
  const userId = TEST_USER_ID;

  it('always reconciles to an empty report', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(walletOperationArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service } = await createWalletTestContext();
        try {
          for (const op of ops) {
            switch (op.type) {
              case 'reserve':
                await service.reserve(userId, op.amount, op.ref, 'USD');
                break;
              case 'commit':
                await service.commit(op.ref, op.amount, op.rake, 'USD');
                break;
              case 'rollback':
                await service.rollback(userId, op.amount, op.ref, 'USD');
                break;
            }
          }
          const report = await service.reconcile();
          expect(report).toHaveLength(0);
        } finally {
          await dataSource.destroy();
        }
      }),
        { numRuns: 25 },
      );
  });

  it('sum of account deltas is zero after reconcile', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc
            .record({
              from: fc.integer({ min: 0, max: 4 }),
              to: fc.integer({ min: 0, max: 4 }),
              amount: fc.integer({ min: 1, max: 100 }),
            })
            .filter((t) => t.from !== t.to),
          { maxLength: 10 },
        ),
        fc
          .tuple(
            fc.integer({ min: -50, max: 50 }),
            fc.integer({ min: -50, max: 50 }),
            fc.integer({ min: -50, max: 50 }),
            fc.integer({ min: -50, max: 50 }),
          )
          .map(([a, b, c, d]) => [a, b, c, d, -(a + b + c + d)]),
        async (transfers, drifts) => {
          const { dataSource, service, journalRepo, accountRepo } =
            await createWalletTestContext();
          try {
            const accountIds = [
              userId,
              RESERVE_ACCOUNT_ID,
              HOUSE_ACCOUNT_ID,
              RAKE_ACCOUNT_ID,
              PRIZE_ACCOUNT_ID,
            ];
            for (const t of transfers) {
              const ref = randomUUID();
              await journalRepo.insert({
                id: randomUUID(),
                accountId: accountIds[t.from],
                amount: -t.amount,
                currency: 'USD',
                refType: 'test',
                refId: ref,
                hash: randomUUID(),
              });
              await journalRepo.insert({
                id: randomUUID(),
                accountId: accountIds[t.to],
                amount: t.amount,
                currency: 'USD',
                refType: 'test',
                refId: ref,
                hash: randomUUID(),
              });
              await accountRepo.increment(
                { id: accountIds[t.from] },
                'balance',
                -t.amount,
              );
              await accountRepo.increment(
                { id: accountIds[t.to] },
                'balance',
                t.amount,
              );
            }
            for (let i = 0; i < accountIds.length; i++) {
              if (drifts[i] !== 0) {
                await accountRepo.increment(
                  { id: accountIds[i] },
                  'balance',
                  drifts[i],
                );
              }
            }
            const report = await service.reconcile();
            const deltaSum = report.reduce(
              (sum, row) => sum + (row.balance - row.journal),
              0,
            );
            expect(deltaSum).toBe(0);
          } finally {
            await dataSource.destroy();
          }
        },
      ),
      { numRuns: 25 },
    );
  });
});

