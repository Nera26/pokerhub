import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { WebhookController } from '../../src/wallet/webhook.controller';
import { KycService } from '../../src/wallet/kyc.service';
import type { Request } from 'express';
import { MockRedis } from '../utils/mock-redis';

describe('Deposit callback', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let controller: WebhookController;
  let provider: PaymentProviderService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  let redis: MockRedis;

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
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;

    provider = {
      initiate3DS: jest.fn().mockResolvedValue({ id: 'ch1' }),
      verifySignature: jest.fn().mockReturnValue(true),
      confirm3DS: jest.fn(),
      registerHandler: jest.fn(),
      drainQueue: jest.fn().mockResolvedValue(undefined),
    } as unknown as PaymentProviderService;

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

    (service as any).enqueueDisbursement = jest.fn();
    (provider.confirm3DS as jest.Mock).mockImplementation(async (payload: unknown) => {
      await service.confirm3DS(payload as any);
    });

    controller = new WebhookController(service, provider, redis as any);
  });

  beforeEach(async () => {
    (events.emit as jest.Mock).mockClear();
    (provider.confirm3DS as jest.Mock).mockClear();
    redis = new MockRedis();
    (service as any).redis = redis;
    controller = new WebhookController(service, provider, redis as any);

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'house',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'user',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await provider?.drainQueue?.();
  });

  it('credits account on valid callback and is idempotent', async () => {
    const challenge = await service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );

    const body = {
      eventId: 'evt-body',
      idempotencyKey: 'idem1',
      providerTxnId: challenge.id,
      status: 'approved',
    };
    const req = {
      headers: {
        'x-provider-signature': 'sig',
        'x-event-id': 'evt1',
      },
    } as unknown as Request;

    await controller.callback(req, body);

    const journalRepo = dataSource.getRepository(JournalEntry);
    const accountRepo = dataSource.getRepository(Account);
    expect(await journalRepo.count()).toBe(2);
    const user = await accountRepo.findOneByOrFail({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    const house = await accountRepo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(50);
    expect(house.balance).toBe(-50);
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.credit',
      expect.objectContaining({
        accountId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        amount: 50,
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.debit',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        amount: 50,
      }),
    );

    await controller.callback(req, body);

    expect(await journalRepo.count()).toBe(2);
    const userAfter = await accountRepo.findOneByOrFail({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    expect(userAfter.balance).toBe(50);
    expect(events.emit).toHaveBeenCalledTimes(2);
    expect(provider.confirm3DS).toHaveBeenCalledTimes(1);
  });
});

