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
import type Redis from 'ioredis';
import { createHmac } from 'crypto';
import type { Request } from 'express';

describe('Provider webhook', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let controller: WebhookController;
  const events = { emit: jest.fn() } as unknown as EventPublisher;
  let redisStore: Record<string, string> = {};
  const redis = {
    set: (
      key: string,
      value: string,
      mode: string,
      _ex: string,
      _ttl: number,
    ): Promise<string | null> => {
      if (mode === 'NX' && redisStore[key]) return Promise.resolve(null);
      redisStore[key] = value;
      return Promise.resolve('OK');
    },
  } as unknown as Redis;
  const provider = new PaymentProviderService();
  const kyc = { validate: jest.fn().mockResolvedValue(undefined) } as unknown as KycService;

  beforeAll(async () => {
    process.env.PROVIDER_WEBHOOK_SECRET = 'shhh';
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
    (service as any).enqueueDisbursement = jest.fn();
    controller = new WebhookController(service, provider);
  });

  beforeEach(async () => {
    redisStore = {};
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save([
      { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'house', balance: 0, kycVerified: false },
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'user', balance: 0, kycVerified: true },
    ]);
    await disbRepo.save({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      accountId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      amount: 50,
      idempotencyKey: 'idem1',
      status: 'pending',
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('validates signature and updates journal exactly once', async () => {
    const body = {
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: 'tx1',
      status: 'approved',
    };
    const sig = createHmac('sha256', 'shhh')
      .update(JSON.stringify(body))
      .digest('hex');
    const req = { headers: { 'x-provider-signature': sig } } as unknown as Request;
    await controller.callback(req, body);
    const disbRepo = dataSource.getRepository(Disbursement);
    const disb = await disbRepo.findOneByOrFail({ id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' });
    expect(disb.status).toBe('completed');
    const journalRepo = dataSource.getRepository(JournalEntry);
    let entries = await journalRepo.find();
    expect(entries).toHaveLength(1);
    expect(entries[0].providerTxnId).toBe('tx1');
    expect(entries[0].providerStatus).toBe('approved');
    await controller.callback(req, body);
    entries = await journalRepo.find();
    expect(entries).toHaveLength(1);
  });

  it('rejects invalid signatures', async () => {
    const body = {
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: 'tx1',
      status: 'approved',
    };
    const req = { headers: { 'x-provider-signature': 'bad' } } as unknown as Request;
    await expect(controller.callback(req, body)).rejects.toThrow('invalid signature');
  });
});
