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
import { AdminDepositsController } from '../routes/admin-deposits.controller';

jest.setTimeout(20000);

describe('Pending deposits', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let removeJob: jest.Mock;
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
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';
    const db = newDb();
    db.public.registerFunction({ name: 'version', returns: 'text', implementation: () => 'pg-mem' });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => userId,
    });
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

    removeJob = jest.fn();
    (service as any).pendingQueue = {
      add: jest.fn(),
      getJob: jest.fn().mockResolvedValue({ remove: removeJob }),
    };

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000010', name: 'house', balance: 0, currency: 'USD' },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('confirms deposit, removes job and credits account without re-triggering events', async () => {
    (service as any).pendingQueue.getJob.mockClear();
    removeJob.mockClear();

    const res = await service.initiateBankTransfer(
      userId,
      100,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });
    expect(deposit.currency).toBe('USD');

    (events.emit as jest.Mock).mockClear();
    await service.confirmPendingDeposit(deposit.id, 'admin');

    expect((service as any).pendingQueue.getJob).toHaveBeenCalledWith(deposit.id);
    expect(removeJob).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      'notification.create',
      expect.objectContaining({ userId, message: 'Deposit confirmed' }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({
        accountId: userId,
        depositId: deposit.id,
        amount: 100,
        currency: 'USD',
      }),
    );
    expect(events.emit).toHaveBeenCalledWith('admin.deposit.confirmed', {
      depositId: deposit.id,
    });

    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(100);

    // idempotent
    (events.emit as jest.Mock).mockClear();
    await service.confirmPendingDeposit(deposit.id, 'admin');
    const userAgain = await accountRepo.findOneByOrFail({ id: userId });
    expect(userAgain.balance).toBe(100);
    expect(events.emit).not.toHaveBeenCalled();

    await service.markActionRequiredIfPending(deposit.id, 'job-x');
    const after = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ id: deposit.id });
    expect(after.actionRequired).toBe(false);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('rejects deposit and notifies', async () => {
    const res = await service.initiateBankTransfer(userId, 50, 'dev2', '1.1.1.2', 'USD');
    const deposit = await dataSource.getRepository(PendingDeposit).findOneByOrFail({ reference: res.reference });

    await service.rejectPendingDeposit(deposit.id, 'admin', 'bad');

    const updated = await dataSource.getRepository(PendingDeposit).findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );
  });

  it('flags deposit for review with queue delay and emits admin event', async () => {
    (events.emit as jest.Mock).mockClear();
    const addSpy = jest.spyOn((service as any).pendingQueue, 'add');

    const res = await service.initiateBankTransfer(userId, 25, 'dev3', '1.1.1.3', 'USD');
    const repo = dataSource.getRepository(PendingDeposit);
    const dep = await repo.findOneByOrFail({ reference: res.reference });

    // not action-required initially
    expect(dep.actionRequired).toBe(false);
    // not listed until action required
    expect(
      (await service.listPendingDeposits()).find((d) => d.id === dep.id),
    ).toBeUndefined();

    // queued with expected delay
    expect(addSpy).toHaveBeenCalledWith(
      'check',
      expect.objectContaining({ id: dep.id }),
      expect.objectContaining({ delay: 10_000 }),
    );

    // mark and verify event emission + persisted state
    await service.markActionRequiredIfPending(dep.id, 'job-123');
    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.actionRequired).toBe(true);
    const listed = await service.listPendingDeposits();
    expect(listed.find((d) => d.id === dep.id)).toBeDefined();
    expect(events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: dep.id,
      jobId: 'job-123',
    });
  });

  it('cancels deposit and prevents action required/listing', async () => {
    (events.emit as jest.Mock).mockClear();

    const res = await service.initiateBankTransfer(userId, 75, 'dev4', '1.1.1.4', 'USD');
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });

    await service.cancelPendingDeposit(userId, deposit.id);

    expect((service as any).pendingQueue.getJob).toHaveBeenCalledWith(deposit.id);
    expect(removeJob).toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      'notification.create',
      expect.objectContaining({ userId, message: 'Deposit cancelled' }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );

    const updated = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');

    await service.markActionRequiredIfPending(deposit.id);
    const after = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ id: deposit.id });
    expect(after.actionRequired).toBe(false);

    const list = await service.listPendingDeposits();
    expect(list.find((d) => d.id === deposit.id)).toBeUndefined();
  });

  it('emits admin notification after delay and confirms deposit via controller', async () => {
    (events.emit as jest.Mock).mockClear();

    const jobs = new Set<string>();
    (service as any).pendingQueue = {
      add: jest.fn(async (_name: string, data: any, opts: any) => {
        const jobId = opts?.jobId ?? data.id;
        jobs.add(jobId);
      }),
      getJob: jest.fn(async (id: string) => (jobs.has(id) ? { id } : null)),
    };

    const accountRepo = dataSource.getRepository(Account);
    const start = await accountRepo.findOneByOrFail({ id: userId });

    const res = await service.initiateBankTransfer(userId, 20, 'dev5', '1.1.1.5', 'USD');
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });

    expect(events.emit).not.toHaveBeenCalled();

    // simulate check after >10s delay
    await service.markActionRequiredIfPending(deposit.id, deposit.id);
    jobs.delete(deposit.id);

    expect(events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: deposit.id,
      jobId: deposit.id,
    });

    const controller = new AdminDepositsController(service);
    await controller.confirm(deposit.id, { userId: 'admin' } as any);

    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(start.balance + 20);

    expect(await (service as any).pendingQueue.getJob(deposit.id)).toBeNull();
  });

  it('auto rejects expired deposits', async () => {
    (events.emit as jest.Mock).mockClear();

    const res = await service.initiateBankTransfer(userId, 20, 'dev6', '1.1.1.6', 'USD');
    const repo = dataSource.getRepository(PendingDeposit);
    const dep = await repo.findOneByOrFail({ reference: res.reference });
    dep.expiresAt = new Date(Date.now() - 1000);
    await repo.save(dep);

    await service.rejectExpiredPendingDeposits();

    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.status).toBe('rejected');
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'admin.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
  });
});
