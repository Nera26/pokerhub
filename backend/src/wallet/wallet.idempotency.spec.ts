import { DataSource } from 'typeorm';
import { setupTestWallet } from './test-utils';
import { WalletService } from './wallet.service';

describe('WalletService idempotency', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let redisStore: Map<string, any>;
  let provider: any;
  let kyc: any;
  let repos: Awaited<ReturnType<typeof setupTestWallet>>['repos'];

  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ({ dataSource, service, redisStore, provider, kyc, repos } =
      await setupTestWallet());
    provider.initiate3DS
      .mockResolvedValueOnce({ id: 'tx1' })
      .mockResolvedValue({ id: 'tx2' });
    kyc.isVerified.mockResolvedValue(true);
    await repos.account.save({
      id: userId,
      name: 'user',
      balance: 0,
      currency: 'USD',
      kycVerified: true,
    });
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('returns cached result for duplicate deposit', async () => {
    const key = 'dep-key';
    const first = await service.deposit(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      key,
    );
    const second = await service.deposit(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      key,
    );
    expect(second).toEqual(first);
    expect(provider.initiate3DS).toHaveBeenCalledTimes(1);
  });

  it('returns cached result for duplicate withdraw', async () => {
    const key = 'wd-key';
    const first = await service.withdraw(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      key,
    );
    const second = await service.withdraw(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      key,
    );
    expect(second).toEqual(first);
    expect(provider.initiate3DS).toHaveBeenCalledTimes(1);
  });
});
