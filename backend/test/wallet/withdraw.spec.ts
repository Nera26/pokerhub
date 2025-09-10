import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { setupWalletTest, WalletTestContext } from './test-utils';

describe('WalletService withdraw', () => {
  let ctx: WalletTestContext;
  let service: WalletService;
  let kyc: any;
  let events: EventPublisher;

  beforeEach(async () => {
    ctx = await setupWalletTest();
    service = ctx.service;
    events = ctx.events;
    kyc = ctx.kyc;
    await ctx.repos.account.save([
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
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
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
    const [key] = await ctx.redis.keys('wallet:withdraw*');
    expect(parseInt((await ctx.redis.get(key)) ?? '0', 10)).toBe(150);
    delete process.env.WALLET_DAILY_WITHDRAW_LIMIT;
  });

  it('commits on challenge success', async () => {
    const challenge = await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'dev2',
      '3.3.3.3',
      'USD',
    );
    await service.confirm3DS({
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: challenge.id,
      status: 'approved',
    });
    const user = await ctx.repos.account.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(900);
    expect(await ctx.repos.disbursement.count()).toBe(1);
  });

  it('ignores failed withdrawals', async () => {
    const challenge = await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd9',
      '9.9.9.9',
      'USD',
    );
    await service.confirm3DS({
      eventId: 'evt2',
      idempotencyKey: 'idem2',
      providerTxnId: challenge.id,
      status: 'chargeback',
    });
    const user = await ctx.repos.account.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(1000);
    expect(await ctx.repos.disbursement.count()).toBe(0);
    expect(await ctx.repos.journal.count()).toBe(0);
  });
});
