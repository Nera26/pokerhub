import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { promises as fs } from 'fs';
import path from 'path';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';

jest.setTimeout(20000);

describe('WalletService.reconcile zero-sum property', () => {
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
    const redis: any = {
      incr: jest.fn().mockResolvedValue(0),
      expire: jest.fn(),
    };
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

  it('reconciliation sums always to zero', async () => {
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
          const total = report.reduce(
            (sum, row) => sum + row.balance - row.journal,
            0,
          );
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
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

