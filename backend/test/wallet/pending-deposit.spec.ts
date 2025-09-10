import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { setupWalletTest, WalletTestContext } from './test-utils';

jest.setTimeout(20000);

describe('Pending deposits', () => {
  let ctx: WalletTestContext;
  let removeJob: jest.Mock;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';
    ctx = await setupWalletTest();
    removeJob = jest.fn();
    (ctx.service as any).pendingQueue = {
      add: jest.fn(),
      getJob: jest.fn().mockResolvedValue({ remove: removeJob }),
    };
    await ctx.repos.account.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await ctx.repos.dataSource.destroy();
  });

  it('confirms deposit, removes job and credits account without re-triggering events', async () => {
    (ctx.service as any).pendingQueue.getJob.mockClear();
    removeJob.mockClear();

    const res = await ctx.service.initiateBankTransfer(
      userId,
      100,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });
    expect(deposit.currency).toBe('USD');

    ((ctx.service as any).events.emit as jest.Mock).mockClear();
    await ctx.service.confirmPendingDeposit(deposit.id, 'admin');

    expect((ctx.service as any).pendingQueue.getJob).toHaveBeenCalledWith(deposit.id);
    expect(removeJob).toHaveBeenCalled();
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'notification.create',
      expect.objectContaining({ userId, message: 'Deposit confirmed' }),
    );
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({
        accountId: userId,
        depositId: deposit.id,
        amount: 100,
        currency: 'USD',
      }),
    );
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith('admin.deposit.confirmed', {
      depositId: deposit.id,
    });

    const accountRepo = ctx.repos.account;
    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(100);

    // idempotent
    ((ctx.service as any).events.emit as jest.Mock).mockClear();
    await ctx.service.confirmPendingDeposit(deposit.id, 'admin');
    const userAgain = await accountRepo.findOneByOrFail({ id: userId });
    expect(userAgain.balance).toBe(100);
    expect((ctx.service as any).events.emit).not.toHaveBeenCalled();

    await ctx.service.markActionRequiredIfPending(deposit.id, 'job-x');
    const after = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(after.actionRequired).toBe(false);
    expect((ctx.service as any).events.emit).not.toHaveBeenCalled();
  });

  it('rejects deposit and notifies', async () => {
    const res = await ctx.service.initiateBankTransfer(userId, 50, 'dev2', '1.1.1.2', 'USD');
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });

    await ctx.service.rejectPendingDeposit(deposit.id, 'admin', 'bad');

    const updated = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );
  });

  it('flags deposit for review with queue delay and emits admin event', async () => {
    ((ctx.service as any).events.emit as jest.Mock).mockClear();
    const addSpy = jest.spyOn((ctx.service as any).pendingQueue, 'add');

    const res = await ctx.service.initiateBankTransfer(userId, 25, 'dev3', '1.1.1.3', 'USD');
    const repo = ctx.repos.pending;
    const dep = await repo.findOneByOrFail({ reference: res.reference });

    // not action-required initially
    expect(dep.actionRequired).toBe(false);
    // not listed until action required
    expect(
      (await ctx.service.listPendingDeposits()).find((d) => d.id === dep.id),
    ).toBeUndefined();

    // queued with expected delay
    expect(addSpy).toHaveBeenCalledWith(
      'check',
      expect.objectContaining({ id: dep.id }),
      expect.objectContaining({ delay: 10_000 }),
    );

    // mark and verify event emission + persisted state
    await ctx.service.markActionRequiredIfPending(dep.id, 'job-123');
    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.actionRequired).toBe(true);
    const listed = await ctx.service.listPendingDeposits();
    expect(listed.find((d) => d.id === dep.id)).toBeDefined();
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: dep.id,
      jobId: 'job-123',
    });
  });

  it('cancels deposit and prevents action required/listing', async () => {
    ((ctx.service as any).events.emit as jest.Mock).mockClear();

    const res = await ctx.service.initiateBankTransfer(userId, 75, 'dev4', '1.1.1.4', 'USD');
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });

    await ctx.service.cancelPendingDeposit(userId, deposit.id);

    expect((ctx.service as any).pendingQueue.getJob).toHaveBeenCalledWith(deposit.id);
    expect(removeJob).toHaveBeenCalled();
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'notification.create',
      expect.objectContaining({ userId, message: 'Deposit cancelled' }),
    );
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );

    const updated = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');

    await ctx.service.markActionRequiredIfPending(deposit.id);
    const after = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(after.actionRequired).toBe(false);

    const list = await ctx.service.listPendingDeposits();
    expect(list.find((d) => d.id === deposit.id)).toBeUndefined();
  });

  it('emits admin notification after delay and confirms deposit via controller', async () => {
    ((ctx.service as any).events.emit as jest.Mock).mockClear();

    const jobs = new Set<string>();
    (ctx.service as any).pendingQueue = {
      add: jest.fn(async (_name: string, data: any, opts: any) => {
        const jobId = opts?.jobId ?? data.id;
        jobs.add(jobId);
      }),
      getJob: jest.fn(async (id: string) => (jobs.has(id) ? { id } : null)),
    };

    const accountRepo = ctx.repos.account;
    const start = await accountRepo.findOneByOrFail({ id: userId });

    const res = await ctx.service.initiateBankTransfer(userId, 20, 'dev5', '1.1.1.5', 'USD');
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });

    expect((ctx.service as any).events.emit).not.toHaveBeenCalled();

    // simulate check after >10s delay
    await ctx.service.markActionRequiredIfPending(deposit.id, deposit.id);
    jobs.delete(deposit.id);

    expect((ctx.service as any).events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: deposit.id,
      jobId: deposit.id,
    });

    const controller = new AdminDepositsController(ctx.service);
    await controller.confirm(deposit.id, { userId: 'admin' } as any);

    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(start.balance + 20);

    expect(await (ctx.service as any).pendingQueue.getJob(deposit.id)).toBeNull();
  });

  it('auto rejects expired deposits', async () => {
    ((ctx.service as any).events.emit as jest.Mock).mockClear();

    const res = await ctx.service.initiateBankTransfer(userId, 20, 'dev6', '1.1.1.6', 'USD');
    const repo = ctx.repos.pending;
    const dep = await repo.findOneByOrFail({ reference: res.reference });
    dep.expiresAt = new Date(Date.now() - 1000);
    await repo.save(dep);

    await ctx.service.rejectExpiredPendingDeposits();

    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.status).toBe('rejected');
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'admin.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
  });
});
