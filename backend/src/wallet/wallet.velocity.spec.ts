import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { WalletService } from './wallet.service';
import { EventPublisher } from '../events/events.service';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';

describe('WalletService velocity limits', () => {
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
    expire: jest.fn(async () => true),
  };
  const provider: any = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn().mockResolvedValue('approved'),
  } as unknown as PaymentProviderService;
  const kyc: any = { isVerified: jest.fn().mockResolvedValue(true) } as KycService;
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
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
    );
    // avoid BullMQ import in tests
    (service as any).enqueueDisbursement = jest.fn();

    await accountRepo.save([
      {
        id: userId,
        name: 'user',
        balance: 200,
        currency: 'USD',
        kycVerified: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
        kycVerified: true,
      },
    ]);
  });

  beforeEach(async () => {
    redisStore.clear();
    jest.clearAllMocks();
    const repo = dataSource.getRepository(Account);
    const user = await repo.findOneByOrFail({ id: userId });
    const house = await repo.findOneByOrFail({ name: 'house' });
    user.balance = 200;
    house.balance = 0;
    await repo.save([user, house]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('enforces hourly deposit count limit', async () => {
    process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT = '2';
    await service.deposit(userId, 10, 'dev1', '1.1.1.1', 'USD');
    await service.deposit(userId, 10, 'dev2', '1.1.1.2', 'USD');
    await expect(
      service.deposit(userId, 10, 'dev3', '1.1.1.3', 'USD'),
    ).rejects.toThrow('Velocity limit exceeded');
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({ accountId: userId, operation: 'deposit' }),
    );
    delete process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT;
  });

  it('enforces hourly withdraw amount limit', async () => {
    process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT = '100';
    await service.withdraw(userId, 70, 'dev1', '1.1.1.1', 'USD');
    await expect(
      service.withdraw(userId, 40, 'dev2', '1.1.1.2', 'USD'),
    ).rejects.toThrow('Velocity limit exceeded');
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({ accountId: userId, operation: 'withdraw' }),
    );
    delete process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT;
  });
});
