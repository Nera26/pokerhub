import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { initPendingDeposit, PendingDepositTestContext } from './test-utils';

/**
 * User initiates bank transfer -> worker flags after 10s -> admin confirms -> wallet balance increases.
 * Kafka/WebSocket events are mocked via EventPublisher spy.
 */
describe('Bank transfer deposit workflow', () => {
  let ctx: PendingDepositTestContext;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ctx = await initPendingDeposit({ userId });
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits wallet after admin confirms flagged deposit', async () => {
    const start = await ctx.repos.account.findOneByOrFail({ id: userId });

    const res = await ctx.service.initiateBankTransfer(
      userId,
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );

    const deposit = await ctx.repos.pending.findOneByOrFail({
      reference: res.reference,
    });

    // worker schedules check after 10s
    ctx.expectScheduledCheck(deposit.id);

    const controller = new AdminDepositsController(ctx.service);

    // worker flags deposit for review
    await ctx.service.markActionRequiredIfPending(deposit.id, deposit.id);

    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'admin.deposit.pending',
      expect.objectContaining({
        depositId: deposit.id,
        jobId: deposit.id,
        userId,
        amount: 50,
        currency: 'USD',
        expectedBalance: start.balance + 50,
        confirmDeposit: expect.any(Function),
        confirmedEvent: expect.objectContaining({
          accountId: userId,
          amount: 50,
          currency: 'USD',
        }),
      }),
    );

    // admin confirms
    await controller.confirm(deposit.id, { userId: 'admin' } as any);

    const user = await ctx.repos.account.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(start.balance + 50);

    expect(ctx.events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({
        accountId: userId,
        amount: 50,
        currency: 'USD',
      }),
    );
  });
});
