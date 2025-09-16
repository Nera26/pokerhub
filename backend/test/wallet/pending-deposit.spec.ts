import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { initPendingDeposit, PendingDepositTestContext } from './test-utils';

jest.setTimeout(20000);

describe('Pending deposits', () => {
  let ctx: PendingDepositTestContext;
  const userId = '11111111-1111-1111-1111-111111111111';

  const pendingQueue = () =>
    (ctx.service as any).pendingQueue as {
      add: jest.Mock;
      getJob: jest.Mock;
    };

  beforeAll(async () => {
    ctx = await initPendingDeposit({ userId });
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  async function verifyPendingDeposit(id: string) {
    (ctx.events.emit as jest.Mock).mockClear();
    await ctx.service.markActionRequiredIfPending(id, id);
    const after = await ctx.repos.pending.findOneByOrFail({ id });
    expect(after.actionRequired).toBe(false);
    const list = await ctx.service.listPendingDeposits();
    expect(list.find((d) => d.id === id)).toBeUndefined();
    expect(ctx.events.emit as jest.Mock).not.toHaveBeenCalled();
  }

  function expectQueueAndNotification(id: string, message: string) {
    expect(pendingQueue().getJob).toHaveBeenCalledWith(id);
    expect(ctx.removeJob).toHaveBeenCalled();
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'notification.create',
      expect.objectContaining({ userId, message }),
    );
  }

  it('confirms deposit, removes job and credits account without re-triggering events', async () => {
    pendingQueue().getJob.mockClear();
    ctx.removeJob.mockClear();

    const res = await ctx.service.initiateBankTransfer(
      userId,
      100,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });
    expect(deposit.currency).toBe('USD');

    (ctx.events.emit as jest.Mock).mockClear();
    await ctx.service.confirmPendingDeposit(deposit.id, 'admin');

    expectQueueAndNotification(deposit.id, 'Deposit confirmed');
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({
        accountId: userId,
        depositId: deposit.id,
        amount: 100,
        currency: 'USD',
      }),
    );
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith('admin.deposit.confirmed', {
      depositId: deposit.id,
    });

    const accountRepo = ctx.repos.account;
    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(100);

    // idempotent
    (ctx.events.emit as jest.Mock).mockClear();
    await ctx.service.confirmPendingDeposit(deposit.id, 'admin');
    const userAgain = await accountRepo.findOneByOrFail({ id: userId });
    expect(userAgain.balance).toBe(100);
    expect(ctx.events.emit as jest.Mock).not.toHaveBeenCalled();

    await verifyPendingDeposit(deposit.id);
  });

  it('rejects deposit and notifies', async () => {
    const res = await ctx.service.initiateBankTransfer(userId, 50, 'dev2', '1.1.1.2', 'USD');
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });

    await ctx.service.rejectPendingDeposit(deposit.id, 'admin', 'bad');

    const updated = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );
  });

  it('flags deposit for review with queue delay and emits admin event', async () => {
    (ctx.events.emit as jest.Mock).mockClear();
    pendingQueue().add.mockClear();

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
    ctx.expectScheduledCheck(dep.id);

    // mark and verify event emission + persisted state
    await ctx.service.markActionRequiredIfPending(dep.id, 'job-123');
    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.actionRequired).toBe(true);
    const listed = await ctx.service.listPendingDeposits();
    expect(listed.find((d) => d.id === dep.id)).toBeDefined();
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: dep.id,
      jobId: 'job-123',
    });
  });

  it('cancels deposit and prevents action required/listing', async () => {
    (ctx.events.emit as jest.Mock).mockClear();
    pendingQueue().getJob.mockClear();
    ctx.removeJob.mockClear();

    const res = await ctx.service.initiateBankTransfer(userId, 75, 'dev4', '1.1.1.4', 'USD');
    const deposit = await ctx.repos.pending.findOneByOrFail({ reference: res.reference });

    await ctx.service.cancelPendingDeposit(userId, deposit.id);

    expectQueueAndNotification(deposit.id, 'Deposit cancelled');
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id, currency: 'USD' }),
    );

    const updated = await ctx.repos.pending.findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');

    await verifyPendingDeposit(deposit.id);
  });

  it('emits admin notification after delay and confirms deposit via controller', async () => {
    (ctx.events.emit as jest.Mock).mockClear();

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

    expect(ctx.events.emit as jest.Mock).not.toHaveBeenCalled();

    // simulate check after >10s delay
    await ctx.service.markActionRequiredIfPending(deposit.id, deposit.id);
    jobs.delete(deposit.id);

    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: deposit.id,
      jobId: deposit.id,
    });

    const controller = new AdminDepositsController(ctx.service);
    await controller.confirm(deposit.id, { userId: 'admin' } as any);

    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(start.balance + 20);

    expect(await pendingQueue().getJob(deposit.id)).toBeNull();
  });

  it('auto rejects expired deposits', async () => {
    (ctx.events.emit as jest.Mock).mockClear();

    const res = await ctx.service.initiateBankTransfer(userId, 20, 'dev6', '1.1.1.6', 'USD');
    const repo = ctx.repos.pending;
    const dep = await repo.findOneByOrFail({ reference: res.reference });
    dep.expiresAt = new Date(Date.now() - 1000);
    await repo.save(dep);

    await ctx.service.rejectExpiredPendingDeposits();

    const updated = await repo.findOneByOrFail({ id: dep.id });
    expect(updated.status).toBe('rejected');
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'admin.deposit.rejected',
      expect.objectContaining({ depositId: dep.id, reason: 'expired' }),
    );
  });
});
