import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';

jest.setTimeout(20000);

describe('WalletService reconciliation', () => {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const userId = '11111111-1111-1111-1111-111111111111';

  const setup = async () => {
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
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(
          16,
          20,
        )}-${id.slice(20)}`;
      },
    });
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const redis: any = {
      incr: jest.fn().mockResolvedValue(0),
      expire: jest.fn(),
    };
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      events,
      redis,
    );
    (service as any).enqueueDisbursement = jest.fn();
    await accountRepo.save([
      { id: userId, name: 'user', balance: 0 },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
      },
      { id: '00000000-0000-0000-0000-000000000002', name: 'house', balance: 0 },
      { id: '00000000-0000-0000-0000-000000000003', name: 'rake', balance: 0 },
      { id: '00000000-0000-0000-0000-000000000004', name: 'prize', balance: 0 },
    ]);
    return { dataSource, service };
  };

  const reserveArb = fc.record({
    type: fc.constant<'reserve'>('reserve'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.string({ minLength: 1, maxLength: 10 }),
  });

  const rollbackArb = fc.record({
    type: fc.constant<'rollback'>('rollback'),
    amount: fc.integer({ min: 1, max: 100 }),
    ref: fc.string({ minLength: 1, maxLength: 10 }),
  });

  const commitArb = fc.integer({ min: 1, max: 100 }).chain((amount) =>
    fc.record({
      type: fc.constant<'commit'>('commit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.string({ minLength: 1, maxLength: 10 }),
    }),
  );

  const opArb = fc.oneof(reserveArb, rollbackArb, commitArb);

  it('produces empty reports for any valid transaction batch', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(opArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service } = await setup();
        try {
          for (const op of ops) {
            switch (op.type) {
              case 'reserve':
                await service.reserve(userId, op.amount, op.ref);
                break;
              case 'commit':
                await service.commit(op.ref, op.amount, op.rake);
                break;
              case 'rollback':
                await service.rollback(userId, op.amount, op.ref);
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
});
