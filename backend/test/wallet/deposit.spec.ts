import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { setupWalletTest, WalletTestContext } from './test-utils';
import {
  expectDailyLimitExceeded,
  expectRateLimitExceeded,
} from './shared-wallet-utils';
import { confirmChallenge } from './transaction-flow';

// Tests for WalletService.deposit

describe('WalletService deposit', () => {
  let ctx: WalletTestContext;
  let service: WalletService;
  let events: EventPublisher;
  let provider: PaymentProviderService;

  beforeEach(async () => {
    ctx = await setupWalletTest();
    service = ctx.service;
    events = ctx.events;
    provider = ctx.provider;
    // MockRedis lacks decr so patch it for tests
    (ctx.redis as any).decr = (key: string) => ctx.redis.decrby(key, 1);
    await ctx.repos.account.save([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'user',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'house',
        balance: 1000,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'unverified',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
    ]);
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
  });

  it('returns 3DS challenge payload', async () => {
    (provider.initiate3DS as jest.Mock).mockResolvedValue({ id: 'challenge1' });
    await expect(
      service.deposit(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'd0',
        '1.1.1.1',
        'USD',
      ),
    ).resolves.toEqual({ id: 'challenge1' });
  });

  it('enforces rate limits', async () => {
    await expectRateLimitExceeded(
      service,
      'deposit',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
  });

  it('rejects deposits for unverified accounts', async () => {
    await expect(
      service.deposit(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        100,
        'd2',
        '3.3.3.3',
        'USD',
      ),
    ).rejects.toThrow('KYC required');
  });

  it('commits on challenge success', async () => {
    const challenge = await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd3',
      '5.5.5.5',
      'USD',
    );
    await confirmChallenge(service, challenge, 'approved');
    const user = await ctx.repos.account.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(100);
    expect(await ctx.repos.journal.count()).toBe(2);
  });

  it('ignores failed challenges', async () => {
    const challenge = await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd4',
      '6.6.6.6',
      'USD',
    );
    await confirmChallenge(service, challenge, 'chargeback');
    const user = await ctx.repos.account.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(0);
    expect(await ctx.repos.journal.count()).toBe(0);
  });

  it('enforces velocity limits', async () => {
    process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT = '2';
    await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      50,
      'v1',
      '8.8.8.8',
      'USD',
    );
    await service.deposit(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      50,
      'v2',
      '8.8.8.9',
      'USD',
    );
    await expect(
      service.deposit(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        50,
        'v3',
        '8.8.8.10',
        'USD',
      ),
    ).rejects.toThrow('Velocity limit exceeded');
    expect(events.emit as jest.Mock).toHaveBeenCalledWith(
      'wallet.velocity.limit',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        operation: 'deposit',
      }),
    );
    const [key] = await ctx.redis.keys('wallet:deposit*');
    expect(parseInt((await ctx.redis.get(key)) ?? '0', 10)).toBe(2);
    delete process.env.WALLET_VELOCITY_DEPOSIT_HOURLY_COUNT;
  });

  it('flags and rejects deposits exceeding daily limits', async () => {
    await expectDailyLimitExceeded(
      service,
      'deposit',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      events,
      ctx.redis,
    );
  });

  it('returns KYC status', async () => {
    const status = await service.status('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(status).toEqual({
      kycVerified: true,
      denialReason: undefined,
      realBalance: 0,
      creditBalance: 0,
      currency: 'USD',
    });
  });
});

