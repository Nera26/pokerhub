import { DataSource } from 'typeorm';
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

describe('WalletService initiateBankTransfer checks', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redisStore = new Map<string, number>();
  const redis: any = {
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
    expire: jest.fn(async () => 1),
    decrby: jest.fn(async (key: string, amt: number) => {
      const val = (redisStore.get(key) ?? 0) - amt;
      redisStore.set(key, val);
      return val;
    }),
    set: jest.fn(),
  };
  const provider = {} as unknown as PaymentProviderService;
  const kyc: any = { isVerified: jest.fn() } as KycService;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
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
    dataSource = db.adapters.createTypeormDataSource({
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
    const settleSvc = new SettlementService(settleRepo);
    service = new WalletService(
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
    (service as any).pendingQueue = { add: jest.fn() };

    await accountRepo.save([
      {
        id: userId,
        name: 'user',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';
  });

  it('throws when KYC not verified', async () => {
    kyc.isVerified.mockResolvedValue(false);
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('KYC required');
  });

  it('blocks when velocity limit exceeded', async () => {
    kyc.isVerified.mockResolvedValue(true);
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('throws when bank transfer env vars missing', async () => {
    kyc.isVerified.mockResolvedValue(true);
    delete process.env.BANK_NAME;
    delete process.env.BANK_ACCOUNT_NUMBER;
    delete process.env.BANK_ROUTING_CODE;
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('Bank transfer configuration missing');
  });
});
