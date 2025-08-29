import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import type Redis from 'ioredis';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';

describe('WalletService deposit', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  let redisStore: Record<string, number> = {};
  const redis = {
    incr: (key: string): Promise<number> => {
      redisStore[key] = (redisStore[key] ?? 0) + 1;
      return Promise.resolve(redisStore[key]);
    },
    incrby: (key: string, value: number): Promise<number> => {
      redisStore[key] = (redisStore[key] ?? 0) + value;
      return Promise.resolve(redisStore[key]);
    },
    decrby: (key: string, value: number): Promise<number> => {
      redisStore[key] = (redisStore[key] ?? 0) - value;
      return Promise.resolve(redisStore[key]);
    },
    expire: (): Promise<void> => Promise.resolve(),
  } as unknown as Redis;

  const provider = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn().mockResolvedValue('approved'),
  } as unknown as PaymentProviderService;

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

    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      getDenialReason: jest.fn().mockResolvedValue(undefined),
    } as unknown as KycService;

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

    // stub disbursement queue
    (service as unknown as { enqueueDisbursement: jest.Mock }).enqueueDisbursement = jest.fn();
  });

  beforeEach(async () => {
    redisStore = {};
    (events.emit as jest.Mock).mockClear();
    (provider.initiate3DS as jest.Mock).mockResolvedValue({ id: 'tx' });
    (provider.getStatus as jest.Mock).mockResolvedValue('approved');
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await settleRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'user',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'house',
        balance: 1000,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'unverified',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('enforces rate limits', async () => {
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd1', '2.2.2.2', 'USD');
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd1', '2.2.2.2', 'USD');
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd1', '2.2.2.2', 'USD');
    await expect(
      service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd1', '2.2.2.2', 'USD'),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('rejects deposits for unverified accounts', async () => {
    await expect(
      service.deposit('cccccccc-cccc-cccc-cccc-cccccccccccc', 100, 'd2', '3.3.3.3', 'USD'),
    ).rejects.toThrow('KYC required');
  });

  it('aborts risky transactions', async () => {
    (provider.initiate3DS as jest.Mock).mockResolvedValueOnce({ id: 'risk' });
    (provider.getStatus as jest.Mock).mockResolvedValueOnce('risky');
    await expect(
      service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd3', '5.5.5.5', 'USD'),
    ).rejects.toThrow('Transaction flagged as risky');
    const jRepo = dataSource.getRepository(JournalEntry);
    expect(await jRepo.count()).toBe(0);
  });

  it('reverses chargebacks', async () => {
    (provider.initiate3DS as jest.Mock).mockResolvedValueOnce({ id: 'cb' });
    (provider.getStatus as jest.Mock).mockResolvedValueOnce('chargeback');
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'd4', '6.6.6.6', 'USD');
    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(0);
    const jRepo = dataSource.getRepository(JournalEntry);
    const entries = await jRepo.find();
    expect(entries.filter((e) => e.providerStatus === 'chargeback').length).toBe(4);
  });

  it('flags and rejects deposits exceeding daily limits', async () => {
    process.env.WALLET_DAILY_DEPOSIT_LIMIT = '200';
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 150, 'd5', '7.7.7.7', 'USD');
    (events.emit as jest.Mock).mockClear();
    await expect(
      service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 60, 'd6', '7.7.7.7', 'USD'),
    ).rejects.toThrow('Daily limit exceeded');
    expect(events.emit as jest.Mock).toHaveBeenCalledWith(
      'antiCheat.flag',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        operation: 'deposit',
      }),
    );
    const key = Object.keys(redisStore).find((k) => k.startsWith('wallet:deposit'));
    expect(redisStore[key!]).toBe(150);
    delete process.env.WALLET_DAILY_DEPOSIT_LIMIT;
  });

  it('returns KYC status', async () => {
    const status = await service.status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(status).toEqual({ kycVerified: true, denialReason: undefined });
  });
});
