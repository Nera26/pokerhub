import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { MockRedis } from './utils/mock-redis';

jest.setTimeout(20000);

describe('WalletService.reconcile property', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const events: EventPublisher = { emit: jest.fn() } as any;

  async function setup() {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    let seq = 1;
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => {
        const id = seq.toString(16).padStart(32, '0');
        seq++;
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
      },
    });
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const redis = new MockRedis();
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
    );
    (service as any).enqueueDisbursement = jest.fn();
    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
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
    return { dataSource, service };
  }

  const reserveArb = fc.record({
    type: fc.constant<'reserve'>('reserve'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });

  const rollbackArb = fc.record({
    type: fc.constant<'rollback'>('rollback'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });

  const commitArb = fc.integer({ min: 1, max: 100 }).chain((amount) =>
    fc.record({
      type: fc.constant<'commit'>('commit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
    }),
  );

  const opArb = fc.oneof(reserveArb, commitArb, rollbackArb);

  it('always reconciles to an empty report', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service } = await setup();
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
          const { dataSource, service } = await setup();
          try {
            const accountIds = [
              userId,
              '00000000-0000-0000-0000-000000000001',
              '00000000-0000-0000-0000-000000000002',
              '00000000-0000-0000-0000-000000000003',
              '00000000-0000-0000-0000-000000000004',
            ];
            const journalRepo = dataSource.getRepository(JournalEntry);
            const accountRepo = dataSource.getRepository(Account);
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

