import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { setupWalletTest, WalletTestContext } from './test-utils';
import {
  expectDailyLimitExceeded,
  expectRateLimitExceeded,
} from './shared-wallet-utils';
import { confirmChallenge } from './transaction-flow';

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
    await expectRateLimitExceeded(
      service,
      'withdraw',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
  });


  it('flags and rejects withdrawals exceeding daily limits', async () => {
    await expectDailyLimitExceeded(
      service,
      'withdraw',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      events,
      ctx.redis,
    );
  });

  it('commits on challenge success', async () => {
    const challenge = await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'dev2',
      '3.3.3.3',
      'USD',
    );
    await confirmChallenge(service, challenge, 'approved');
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
    await confirmChallenge(service, challenge, 'chargeback');
    const user = await ctx.repos.account.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(1000);
    expect(await ctx.repos.disbursement.count()).toBe(0);
    expect(await ctx.repos.journal.count()).toBe(0);
  });
});
