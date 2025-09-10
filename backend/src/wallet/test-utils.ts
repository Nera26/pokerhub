import { DataSource, EntityTarget } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { PendingDeposit } from './pending-deposit.entity';
import { WalletService } from './wallet.service';
import { EventPublisher } from '../events/events.service';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';
import { SettlementService } from './settlement.service';

export async function createInMemoryDb(
  entities: EntityTarget<any>[],
): Promise<DataSource> {
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
    entities,
    synchronize: true,
  }) as DataSource;
  await dataSource.initialize();
  return dataSource;
}

export async function setupTestWallet() {
  const events: EventPublisher = { emit: jest.fn() } as any;

  const redisStore = new Map<string, any>();
  let depSeq = 0;
  const redis: any = {
    incr: jest.fn(async (key: string) => {
      if (key === 'wallet:deposit:ref') {
        depSeq += 1;
        return depSeq;
      }
      const val = (Number(redisStore.get(key)) || 0) + 1;
      redisStore.set(key, val);
      return val;
    }),
    incrby: jest.fn(async (key: string, amt: number) => {
      const val = (Number(redisStore.get(key)) || 0) + amt;
      redisStore.set(key, val);
      return val;
    }),
    decr: jest.fn(async (key: string) => {
      const val = (Number(redisStore.get(key)) || 0) - 1;
      redisStore.set(key, val);
      return val;
    }),
    decrby: jest.fn(async (key: string, amt: number) => {
      const val = (Number(redisStore.get(key)) || 0) - amt;
      redisStore.set(key, val);
      return val;
    }),
    expire: jest.fn(async () => 1),
    set: jest.fn(async (key: string, value: string, mode?: string) => {
      if (mode === 'NX' && redisStore.has(key)) return null;
      redisStore.set(key, value);
      return 'OK';
    }),
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    del: jest.fn(async (key: string) => (redisStore.delete(key) ? 1 : 0)),
  };

  const provider: any = { initiate3DS: jest.fn() } as PaymentProviderService;
  const kyc: any = { isVerified: jest.fn() } as KycService;

  const dataSource = await createInMemoryDb([
    Account,
    JournalEntry,
    Disbursement,
    SettlementJournal,
    PendingDeposit,
  ]);

  const account = dataSource.getRepository(Account);
  const journal = dataSource.getRepository(JournalEntry);
  const disbursement = dataSource.getRepository(Disbursement);
  const settlement = dataSource.getRepository(SettlementJournal);
  const pending = dataSource.getRepository(PendingDeposit);

  const settlementSvc = new SettlementService(settlement);

  const service = new WalletService(
    account,
    journal,
    disbursement,
    settlement,
    pending,
    events,
    redis,
    provider,
    kyc,
    settlementSvc,
  );
  (service as any).pendingQueue = { add: jest.fn() };

  return {
    dataSource,
    service,
    repos: { account, journal, disbursement, settlement, pending },
    redis,
    redisStore,
    provider,
    kyc,
  };
}
