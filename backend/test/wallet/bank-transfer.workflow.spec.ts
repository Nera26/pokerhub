import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
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
import { AdminDepositsController } from '../../src/routes/admin-deposits.controller';

/**
 * User initiates bank transfer -> worker flags after 10s -> admin confirms -> wallet balance increases.
 * Kafka/WebSocket events are mocked via EventPublisher spy.
 */
describe('Bank transfer deposit workflow', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;

  const redis: any = {
    incr: jest.fn(),
    incrby: jest.fn().mockResolvedValue(0),
    expire: jest.fn(),
    set: jest.fn().mockResolvedValue('1'),
    del: jest.fn(),
  };

  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({ name: 'version', returns: 'text', implementation: () => 'pg-mem' });
    db.public.registerFunction({ name: 'current_database', returns: 'text', implementation: () => 'test' });
    db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'text', implementation: () => userId });

    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal, PendingDeposit],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const provider = {} as unknown as PaymentProviderService;
    const kyc = { isVerified: jest.fn().mockResolvedValue(true) } as unknown as KycService;
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

    (service as any).pendingQueue = {
      add: jest.fn(),
      getJob: jest.fn(async () => null),
    };

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000010', name: 'house', balance: 0, currency: 'USD' },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits wallet after admin confirms flagged deposit', async () => {
    const accountRepo = dataSource.getRepository(Account);
    const start = await accountRepo.findOneByOrFail({ id: userId });

    const res = await service.initiateBankTransfer(userId, 50, 'dev1', '1.1.1.1', 'USD');
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });

    // worker schedules check after 10s
    expect((service as any).pendingQueue.add).toHaveBeenCalledWith(
      'check',
      expect.objectContaining({ id: deposit.id }),
      expect.objectContaining({ delay: 10_000 }),
    );

    // worker flags deposit for review
    await service.markActionRequiredIfPending(deposit.id, deposit.id);
    expect(events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: deposit.id,
      jobId: deposit.id,
    });

    const controller = new AdminDepositsController(service);
    await controller.confirm(deposit.id, { userId: 'admin' } as any);

    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(start.balance + 50);

    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({ accountId: userId, amount: 50, currency: 'USD' }),
    );
  });
});

