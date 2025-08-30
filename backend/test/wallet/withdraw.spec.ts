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

describe('WalletService withdraw', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let kyc: KycService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  let redis: MockRedis;
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
    kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;
  });

  beforeEach(async () => {
    redis = new MockRedis();
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
        balance: 1000,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'house',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
    ]);
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
    (
      service as unknown as { enqueueDisbursement: jest.Mock }
    ).enqueueDisbursement = jest.fn();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('requires KYC verification', async () => {
    (kyc.isVerified as jest.Mock).mockResolvedValueOnce(false);
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'dev1',
        '1.1.1.1',
        'USD',
      ),
    ).rejects.toThrow('KYC required');
  });

  it('enforces rate limits', async () => {
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
      'USD',
    );
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
      'USD',
    );
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
      'USD',
    );
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'd1',
        '2.2.2.2',
        'USD',
      ),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('marks disbursement complete only once', async () => {
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'dev2',
      '3.3.3.3',
      'USD',
    );
    const disbRepo = dataSource.getRepository(Disbursement);
    const disb = await disbRepo.findOneByOrFail({
      accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    await service.processDisbursement(
      'evt1',
      disb.idempotencyKey,
      'payout',
      'approved',
    );
    await service.processDisbursement(
      'evt1',
      disb.idempotencyKey,
      'payout',
      'approved',
    );
    const updated = await disbRepo.findOneByOrFail({ id: disb.id });
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeTruthy();
  });

  it('flags and rejects withdrawals exceeding daily limits', async () => {
    process.env.WALLET_DAILY_WITHDRAW_LIMIT = '200';
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      150,
      'dev3',
      '4.4.4.4',
      'USD',
    );
    (events.emit as jest.Mock).mockClear();
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        60,
        'dev4',
        '4.4.4.4',
        'USD',
      ),
    ).rejects.toThrow('Daily limit exceeded');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(events.emit as jest.Mock).toHaveBeenCalledWith(
      'antiCheat.flag',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        operation: 'withdraw',
        currency: 'USD',
      }),
    );
    const [key] = await redis.keys('wallet:withdraw*');
    expect(parseInt((await redis.get(key)) ?? '0', 10)).toBe(150);
    delete process.env.WALLET_DAILY_WITHDRAW_LIMIT;
  });

  it('aborts risky withdrawals', async () => {
    (provider.initiate3DS as jest.Mock).mockResolvedValueOnce({ id: 'risk' });
    (provider.getStatus as jest.Mock).mockResolvedValueOnce('risky');
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'd9',
        '9.9.9.9',
        'USD',
      ),
    ).rejects.toThrow('Transaction flagged as risky');
    const jRepo = dataSource.getRepository(JournalEntry);
    expect(await jRepo.count()).toBe(0);
  });
});
