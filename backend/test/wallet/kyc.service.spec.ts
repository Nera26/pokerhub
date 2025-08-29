import { KycService } from '../../src/wallet/kyc.service';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import type { Account } from '../../src/wallet/account.entity';

describe('KycService', () => {
  it('denies blocked region and caches reason', async () => {
    const accounts = { update: jest.fn() } as unknown as Repository<Account>;
    const store = new Map<string, unknown>();
    const cache: Cache = {
      get: jest.fn((key: string) => Promise.resolve(store.get(key))),
      set: jest.fn((key: string, value: unknown) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      del: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
    } as any;
    process.env.KYC_BLOCKED_REGIONS = 'US';
    const svc = new KycService(accounts, cache);
    await expect(
      svc.validate({ id: '1', name: 't', kycVerified: false, region: 'US' } as any),
    ).rejects.toThrow('region US blocked');
    await expect(svc.getDenialReason('1')).resolves.toBe('region US blocked');
  });
});
