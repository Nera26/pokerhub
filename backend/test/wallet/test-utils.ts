import { DataSource } from 'typeorm';
import { createDataSource } from '../utils/pgMem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementService } from '../../src/wallet/settlement.service';

export async function setupWalletTest() {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redisStore = new Map<string, number>();
  const redis: any = {
    store: redisStore,
    incr: jest.fn(async (key: string) => {
      const val = (redisStore.get(key) ?? 0) + 1;
      redisStore.set(key, val);
      return val;
    }),
    incrby: jest.fn(async (key: string, amt: number) => {
      const val = (redisStore.get(key) ?? 0) + amt;
      redisStore.set(key, val);
      return val;
    }),
    decr: jest.fn(async (key: string) => {
      const val = (redisStore.get(key) ?? 0) - 1;
      redisStore.set(key, val);
      return val;
    }),
    decrby: jest.fn(async (key: string, amt: number) => {
      const val = (redisStore.get(key) ?? 0) - amt;
      redisStore.set(key, val);
      return val;
    }),
    expire: jest.fn(async () => 1),
    set: jest.fn(async (key: string, value: string, _mode?: string, _ttl?: number) => {
      redisStore.set(key, Number(value));
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      redisStore.delete(key);
      return 1;
    }),
  };

  const provider: any = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn().mockResolvedValue('approved'),
  } as unknown as PaymentProviderService;

  const kyc: any = {
    isVerified: jest.fn().mockResolvedValue(true),
    validate: jest.fn(),
    getDenialReason: jest.fn().mockResolvedValue(undefined),
  } as KycService;

  const dataSource = await createDataSource([
    Account,
    JournalEntry,
    Disbursement,
    SettlementJournal,
    PendingDeposit,
  ]);

  const accountRepo = dataSource.getRepository(Account);
  const journalRepo = dataSource.getRepository(JournalEntry);
  const disbRepo = dataSource.getRepository(Disbursement);
  const settleRepo = dataSource.getRepository(SettlementJournal);
  const pendingRepo = dataSource.getRepository(PendingDeposit);

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
    service,
    repos: {
      dataSource,
      account: accountRepo,
      journal: journalRepo,
      disbursement: disbRepo,
      settlement: settleRepo,
      pending: pendingRepo,
    },
    redis,
  };
}

export type WalletTestContext = Awaited<ReturnType<typeof setupWalletTest>>;
