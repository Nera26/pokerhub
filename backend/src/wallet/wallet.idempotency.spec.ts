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

describe('WalletService idempotency', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redisStore = new Map<string, string>();
  const redis: any = {
    incr: jest.fn(async (key: string) => {
      const val = (Number(redisStore.get(key)) || 0) + 1;
      redisStore.set(key, String(val));
      return val;
    }),
    incrby: jest.fn(async (key: string, amt: number) => {
      const val = (Number(redisStore.get(key)) || 0) + amt;
      redisStore.set(key, String(val));
      return val;
    }),
    decr: jest.fn(async (key: string) => {
      const val = (Number(redisStore.get(key)) || 0) - 1;
      redisStore.set(key, String(val));
      return val;
    }),
    decrby: jest.fn(async (key: string, amt: number) => {
      const val = (Number(redisStore.get(key)) || 0) - amt;
      redisStore.set(key, String(val));
      return val;
    }),
    expire: jest.fn(async () => 1),
    set: jest.fn(async (key: string, value: string, ...args: any[]) => {
      if (args.includes('NX') && redisStore.has(key)) return null;
      redisStore.set(key, value);
      return 'OK';
    }),
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    del: jest.fn(async (key: string) => (redisStore.delete(key) ? 1 : 0)),
  };
  const provider: any = {
    initiate3DS: jest
      .fn()
      .mockResolvedValueOnce({ id: 'tx1' })
      .mockResolvedValue({ id: 'tx2' }),
  } as PaymentProviderService;
  const kyc: any = {
    isVerified: jest.fn().mockResolvedValue(true),
  } as KycService;
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

    await accountRepo.save({
      id: userId,
      name: 'user',
      balance: 0,
      currency: 'USD',
      kycVerified: true,
    });
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('returns cached result for duplicate deposit', async () => {
    const key = 'dep-key';
    const first = await service.deposit(userId, 10, 'dev', '1.1.1.1', 'USD', key);
    const second = await service.deposit(userId, 10, 'dev', '1.1.1.1', 'USD', key);
    expect(second).toEqual(first);
    expect(provider.initiate3DS).toHaveBeenCalledTimes(1);
  });

  it('returns cached result for duplicate withdraw', async () => {
    const key = 'wd-key';
    const first = await service.withdraw(userId, 10, 'dev', '1.1.1.1', 'USD', key);
    const second = await service.withdraw(userId, 10, 'dev', '1.1.1.1', 'USD', key);
    expect(second).toEqual(first);
    expect(provider.initiate3DS).toHaveBeenCalledTimes(1);
  });
});
