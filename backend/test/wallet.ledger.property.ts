import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';

jest.setTimeout(20000);

interface BatchEntry {
  account: number;
  delta: number;
}

describe('wallet ledger commitBatch property', () => {
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
    const redis: any = { incr: jest.fn().mockResolvedValue(0), expire: jest.fn() };
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
    const accounts = await accountRepo.save([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'a',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'b',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'c',
        balance: 0,
        currency: 'USD',
      },
    ]);
    return { dataSource, service, accounts, journalRepo };
  }

  function commitBatch(
    service: WalletService,
    accounts: Account[],
    batch: BatchEntry[],
    ref: string,
  ) {
    return (service as any).record(
      'test',
      ref,
      batch.map((e) => ({ account: accounts[e.account], amount: e.delta })),
    );
  }

  const batchArb = fc
    .array(
      fc.record({
        account: fc.integer({ min: 0, max: 2 }),
        delta: fc.integer({ min: -100, max: 100 }).filter((n) => n !== 0),
      }),
      { minLength: 1, maxLength: 4 },
    )
    .chain((entries) =>
      fc.integer({ min: 0, max: 2 }).map((account) => {
        const sum = entries.reduce((s, e) => s + e.delta, 0);
        return [...entries, { account, delta: -sum }];
      }),
    );

  it('ledger deltas always sum to zero', async () => {
    await fc.assert(
      fc.asyncProperty(batchArb, async (batch) => {
        const { dataSource, service, accounts, journalRepo } = await setup();
        try {
          const ref = randomUUID();
          await commitBatch(service, accounts, batch, ref);
          const entries = await journalRepo.find({ where: { refType: 'test', refId: ref } });
          const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
          if (total !== 0) {
            // eslint-disable-next-line no-console
            console.log('Failing batch:', batch);
          }
          expect(total).toBe(0);
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

