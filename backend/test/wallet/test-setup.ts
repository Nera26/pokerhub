import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { MockRedis } from '../utils/mock-redis';
import { SettlementService } from '../../src/wallet/settlement.service';

export async function setupTestWallet() {
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
    entities: [
      Account,
      JournalEntry,
      Disbursement,
      SettlementJournal,
      PendingDeposit,
    ],
    synchronize: true,
  }) as DataSource;
  await dataSource.initialize();

  const accountRepo = dataSource.getRepository(Account);
  const journalRepo = dataSource.getRepository(JournalEntry);
  const disbRepo = dataSource.getRepository(Disbursement);
  const settleRepo = dataSource.getRepository(SettlementJournal);
  const pendingRepo = dataSource.getRepository(PendingDeposit);

  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis = new MockRedis();
  const provider = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn(),
  } as unknown as PaymentProviderService;
  const kyc = {
    validate: jest.fn().mockResolvedValue(undefined),
    isVerified: jest.fn().mockResolvedValue(true),
  } as unknown as KycService;

  const settleSvc = new SettlementService(settleRepo);

  const service = new WalletService(
    accountRepo,
    journalRepo,
    disbRepo,
    settleRepo,
    pendingRepo,
    events,
    redis,
    provider,
    kyc,
    settleSvc,
  );
  (service as any).enqueueDisbursement = jest.fn();
  (service as any).pendingQueue = { add: jest.fn(), getJob: jest.fn() };

  return {
    dataSource,
    service,
    repos: {
      account: accountRepo,
      journal: journalRepo,
      disbursement: disbRepo,
      settlement: settleRepo,
      pending: pendingRepo,
    },
    events,
    provider,
    kyc,
    redis,
  };
}

export type WalletTestContext = Awaited<ReturnType<typeof setupTestWallet>>;
