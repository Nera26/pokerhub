import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementService } from '../src/wallet/settlement.service';
import { MockRedis } from './utils/mock-redis';

jest.setTimeout(20000);

interface BatchEntry {
  account: number;
  delta: number;
}

const events: EventPublisher = { emit: jest.fn() } as any;

async function writeFailure(data: unknown) {
  const dir = path.join(__dirname, '../../storage');
  await fs.mkdir(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `reconcile-${today}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

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
  const settlementSvc = {
    reserve: jest.fn(),
    commit: jest.fn(),
    cancel: jest.fn(),
  } as unknown as SettlementService;
  const service = new WalletService(
    accountRepo,
    journalRepo,
    disbRepo,
    settleRepo,
    events,
    redis,
    provider,
    kyc,
    settlementSvc,
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
  .uniqueArray(
    fc.record({
      account: fc.integer({ min: 0, max: 2 }),
      delta: fc.integer({ min: -100, max: 100 }).filter((n) => n !== 0),
    }),
    { minLength: 1, maxLength: 2, selector: (a) => a.account },
  )
  .chain((entries) =>
    fc
      .integer({ min: 0, max: 2 })
      .filter((account) => !entries.some((e) => e.account === account))
      .map((account) => {
        const sum = entries.reduce((s, e) => s + e.delta, 0);
        return [...entries, { account, delta: -sum }];
      }),
  );

describe('ledger batch property', () => {
  it('each transaction batch nets to zero', async () => {
    await fc.assert(
      fc.asyncProperty(batchArb, async (batch) => {
        const { dataSource, service, accounts, journalRepo } = await setup();
        try {
          const ref = randomUUID();
          await commitBatch(service, accounts, batch, ref);
          const entries = await journalRepo.find({ where: { refType: 'test', refId: ref } });
          const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
          if (total !== 0) {
            await writeFailure({ kind: 'batch', batch, entries, total });
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

