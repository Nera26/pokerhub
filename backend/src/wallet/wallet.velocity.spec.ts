import { setupWalletTest, WalletTestContext } from '../../test/wallet/test-utils';

describe('WalletService velocity limits', () => {
  let ctx: WalletTestContext;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ctx = await setupWalletTest();
    await ctx.repos.account.save([
      {
        id: userId,
        name: 'user',
        balance: 200,
        currency: 'USD',
        kycVerified: true,
      },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
        kycVerified: true,
      },
    ]);
  });

  beforeEach(async () => {
    ctx.redis.store.clear();
    jest.clearAllMocks();
    const repo = ctx.repos.account;
    const user = await repo.findOneByOrFail({ id: userId });
    const house = await repo.findOneByOrFail({ name: 'house' });
    user.balance = 200;
    house.balance = 0;
    await repo.save([user, house]);
  });

  afterAll(async () => {
    await ctx.repos.dataSource.destroy();
  });

  it('enforces hourly deposit count limit', async () => {
    process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT = '2';
    await ctx.service.deposit(userId, 10, 'dev1', '1.1.1.1', 'USD');
    await ctx.service.deposit(userId, 10, 'dev2', '1.1.1.2', 'USD');
    await expect(
      ctx.service.deposit(userId, 10, 'dev3', '1.1.1.3', 'USD'),
    ).rejects.toThrow('Velocity limit exceeded');
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({ accountId: userId, operation: 'deposit' }),
    );
    expect(ctx.redis.store.get(`wallet:deposit:${userId}:h:count`)).toBe(2);
    delete process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT;
  });

  it('enforces hourly withdraw amount limit', async () => {
    process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT = '100';
    await ctx.service.withdraw(userId, 70, 'dev1', '1.1.1.1', 'USD');
    await expect(
      ctx.service.withdraw(userId, 40, 'dev2', '1.1.1.2', 'USD'),
    ).rejects.toThrow('Velocity limit exceeded');
    expect((ctx.service as any).events.emit).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({ accountId: userId, operation: 'withdraw' }),
    );
    expect(ctx.redis.store.get(`wallet:withdraw:${userId}:h:amount`)).toBe(70);
    delete process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT;
  });

  it('rolls back hourly count on redis error', async () => {
    process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT = '2';
    const originalCheck = (ctx.service as any).checkVelocity;
    (ctx.service as any).checkVelocity = jest.fn();
    ctx.redis.incr.mockImplementationOnce(async (key: string) => {
      const val = (ctx.redis.store.get(key) ?? 0) + 1;
      ctx.redis.store.set(key, val);
      throw new Error('boom');
    });
    await expect(
      ctx.service.deposit(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('boom');
    expect(ctx.redis.store.get(`wallet:deposit:${userId}:h:count`)).toBe(0);
    (ctx.service as any).checkVelocity = originalCheck;
    delete process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT;
  });

  it('rolls back hourly amount on redis error', async () => {
    process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT = '100';
    const originalCheck = (ctx.service as any).checkVelocity;
    (ctx.service as any).checkVelocity = jest.fn();
    ctx.redis.incrby.mockImplementationOnce(async (key: string, amt: number) => {
      const val = (ctx.redis.store.get(key) ?? 0) + amt;
      ctx.redis.store.set(key, val);
      throw new Error('boom');
    });
    await expect(
      ctx.service.withdraw(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('boom');
    expect(ctx.redis.store.get(`wallet:withdraw:${userId}:h:amount`)).toBe(0);
    (ctx.service as any).checkVelocity = originalCheck;
    delete process.env.WALLET_VELOCITY_WITHDRAW_HOURLY_AMOUNT;
  });
});
