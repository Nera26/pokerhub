import fc from 'fast-check';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import type Redis from 'ioredis';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';

jest.setTimeout(20000);

describe('WalletService zero-sum property', () => {
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  const userId = '11111111-1111-1111-1111-111111111111';

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
    const redis = {
      incr: (): Promise<number> => Promise.resolve(0),
      expire: (): Promise<void> => Promise.resolve(),
    } as unknown as Redis;
    const provider = {
      initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
      getStatus: jest.fn().mockResolvedValue('approved'),
    } as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn().mockResolvedValue(undefined) } as unknown as KycService;
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
    Object.assign(service, { enqueueDisbursement: jest.fn() });
    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'house',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'rake',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'prize',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
    ]);
    await service.deposit(userId, 1000, 'dev', '127.0.0.1', 'USD');
    return { dataSource, service, journalRepo };
  }

  const txArb = fc.integer({ min: 1, max: 100 }).chain((amount) =>
    fc.record({
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
    }),
  );

  it('maintains zero-sum balance and consistent journals', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(txArb, { maxLength: 5 }), async (txs) => {
        const { dataSource, service, journalRepo } = await setup();
        let expectedEntries = 2; // initial deposit
        try {
          for (let i = 0; i < txs.length; i++) {
            const tx = txs[i];
            const ref = `tx${i}`;
            await service.reserve(userId, tx.amount, ref, 'USD');
            await service.commit(ref, tx.amount, tx.rake, 'USD');
            await service.rollback(userId, tx.amount, ref, 'USD');
            expectedEntries += 7; // 2 reserve + 3 commit + 2 rollback
            const total = await service.totalBalance();
            expect(total).toBe(0);
            const count = await journalRepo.count();
            expect(count).toBe(expectedEntries);
            const entries = await journalRepo.find();
            expect(entries.every((e) => e.currency === 'USD')).toBe(true);
            const report = await service.reconcile();
            expect(report).toHaveLength(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});
