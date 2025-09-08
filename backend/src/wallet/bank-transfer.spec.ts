import { DataSource } from 'typeorm';
import { setupTestWallet } from './test-utils';
import { WalletService } from './wallet.service';

describe('WalletService initiateBankTransfer checks', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let redisStore: Map<string, any>;
  let kyc: any;
  let repos: Awaited<ReturnType<typeof setupTestWallet>>['repos'];

  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    ({ dataSource, service, redisStore, kyc, repos } = await setupTestWallet());
    await repos.account.save([
      {
        id: userId,
        name: 'user',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';
  });

  it('throws when KYC not verified', async () => {
    kyc.isVerified.mockResolvedValue(false);
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('KYC required');
  });

  it('blocks when velocity limit exceeded', async () => {
    kyc.isVerified.mockResolvedValue(true);
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD');
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('throws when bank transfer env vars missing', async () => {
    kyc.isVerified.mockResolvedValue(true);
    delete process.env.BANK_NAME;
    delete process.env.BANK_ACCOUNT_NUMBER;
    delete process.env.BANK_ROUTING_CODE;
    await expect(
      service.initiateBankTransfer(userId, 10, 'dev', '1.1.1.1', 'USD'),
    ).rejects.toThrow('Bank transfer configuration missing');
  });

  it('generates unique deposit references with prefix', async () => {
    kyc.isVerified.mockResolvedValue(true);
    const first = await service.initiateBankTransfer(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
    );
    const second = await service.initiateBankTransfer(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
    );
    expect(first.reference).toMatch(/^DEP\d{5}$/);
    expect(second.reference).toMatch(/^DEP\d{5}$/);
    expect(second.reference).not.toBe(first.reference);
  });

  it('returns same response for repeated idempotent requests', async () => {
    kyc.isVerified.mockResolvedValue(true);
    const repo = repos.pending;
    const before = await repo.count();
    const first = await service.initiateBankTransfer(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      'idem-key',
    );
    const mid = await repo.count();
    const second = await service.initiateBankTransfer(
      userId,
      10,
      'dev',
      '1.1.1.1',
      'USD',
      'idem-key',
    );
    const after = await repo.count();
    expect(second).toEqual(first);
    expect(mid).toBe(before + 1);
    expect(after).toBe(mid);
  });
});
