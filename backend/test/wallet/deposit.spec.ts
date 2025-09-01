import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { MockRedis } from '../utils/mock-redis';

describe('WalletService deposit', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  let redis: MockRedis;

  const provider = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
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

    redis = new MockRedis();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);

    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      getDenialReason: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
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
    redis = new MockRedis();
    (redis as any).decr = (key: string) => redis.decrby(key, 1);
    (service as any).redis = redis;
    (events.emit as jest.Mock).mockClear();
    (provider.initiate3DS as jest.Mock).mockResolvedValue({ id: 'tx' });
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

  it('returns 3DS challenge payload', async () => {
    (provider.initiate3DS as jest.Mock).mockResolvedValue({ id: 'challenge1' });
    await expect(
      service.deposit(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'd0',
        '1.1.1.1',
        'USD',
      ),
    ).resolves.toEqual({ id: 'challenge1' });
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

  it('commits on challenge success', async () => {
    const challenge = await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd3',
      '5.5.5.5',
      'USD',
    );
    await service.confirm3DS({
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: challenge.id,
      status: 'approved',
    });
    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(100);
    const jRepo = dataSource.getRepository(JournalEntry);
    expect(await jRepo.count()).toBe(2);
  });

  it('ignores failed challenges', async () => {
    const challenge = await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd4',
      '6.6.6.6',
      'USD',
    );
    await service.confirm3DS({
      eventId: 'evt2',
      idempotencyKey: 'idem2',
      providerTxnId: challenge.id,
      status: 'chargeback',
    });
    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(0);
    const jRepo = dataSource.getRepository(JournalEntry);
    expect(await jRepo.count()).toBe(0);
  });

  it('enforces velocity limits', async () => {
    process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT = '2';
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'v1', '8.8.8.8', 'USD');
    await service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'v2', '8.8.8.9', 'USD');
    await expect(
      service.deposit('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'v3', '8.8.8.10', 'USD'),
    ).rejects.toThrow('Velocity limit exceeded');
    expect(events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        operation: 'deposit',
      }),
    );
    const [key] = await redis.keys('wallet:deposit*');
    expect(parseInt((await redis.get(key)) ?? '0', 10)).toBe(2);
    delete process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT;
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
        currency: 'USD',
      }),
    );
    const dateKey = new Date().toISOString().slice(0, 10);
    const key = `wallet:deposit:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:${dateKey}`;
    expect(parseInt((await redis.get(key)) ?? '0', 10)).toBe(150);
    delete process.env.WALLET_DAILY_DEPOSIT_LIMIT;
  });

  it('returns KYC status', async () => {
    const status = await service.status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(status).toEqual({
      kycVerified: true,
      denialReason: undefined,
      realBalance: 0,
      creditBalance: 0,
    });
  });
});
