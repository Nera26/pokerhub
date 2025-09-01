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
import { createHmac } from 'crypto';
import type { Request } from 'express';
import { MockRedis } from '../utils/mock-redis';

describe('Provider webhook', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let controller: WebhookController;
  let provider: PaymentProviderService;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  const redis = new MockRedis();
  const kyc = {
    validate: jest.fn().mockResolvedValue(undefined),
    isVerified: jest.fn().mockResolvedValue(true),
  } as unknown as KycService;

  beforeAll(async () => {
    process.env.PROVIDER_WEBHOOK_SECRET = 'shhh';
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6379';
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
    provider = new PaymentProviderService(redis as any);
    jest
      .spyOn(provider, 'initiate3DS')
      .mockResolvedValue({ id: 'tx1' } as any);
    jest
      .spyOn(provider as any, 'handleWebhook')
      .mockImplementation(async (event: any) => {
        await service.confirm3DS(event);
      });
    jest.spyOn(provider, 'drainQueue').mockResolvedValue();
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
    controller = new WebhookController(service, provider);
  });

  beforeEach(async () => {
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save([
      { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'house', balance: 0, kycVerified: false, currency: 'USD' },
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await provider?.drainQueue();
    await (provider as any).retryWorker?.close();
    await (provider as any).retryQueue?.close();
  });

  it('validates signature and updates journal exactly once', async () => {
    const challenge = await service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const body = {
      id: 'evt1',
      type: 'payment_intent.succeeded',
      data: { object: { id: challenge.id, status: 'succeeded' } },
    };
    const sig = createHmac('sha256', 'shhh')
      .update(JSON.stringify(body))
      .digest('hex');
    const req = { headers: { 'x-provider-signature': sig } } as unknown as Request;
    await controller.callback(req, body);
    const journalRepo = dataSource.getRepository(JournalEntry);
    let entries = await journalRepo.find();
    expect(entries).toHaveLength(2);
    expect(entries[0].providerTxnId).toBe(challenge.id);
    await controller.callback(req, body);
    entries = await journalRepo.find();
    expect(entries).toHaveLength(2);
  });

  it('rejects invalid signatures', async () => {
    const challenge = await service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const body = {
      id: 'evt1',
      type: 'payment_intent.succeeded',
      data: { object: { id: challenge.id, status: 'succeeded' } },
    };
    const req = { headers: { 'x-provider-signature': 'bad' } } as unknown as Request;
    await expect(controller.callback(req, body)).rejects.toThrow('invalid signature');
  });
});
