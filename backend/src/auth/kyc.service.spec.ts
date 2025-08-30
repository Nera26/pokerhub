import { KycService } from './kyc.service';
import type { Repository } from 'typeorm';
import type { KycVerification } from '../database/entities/kycVerification.entity';
import type { Account } from '../wallet/account.entity';
import type { CountryProvider } from './providers/country-provider';
import type { ConfigService } from '@nestjs/config';

describe('KycService', () => {
  it('blocks users from restricted countries', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('IR'),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
    );
    await expect(service.runChecks('good', '1.1.1.1')).rejects.toThrow(
      'Blocked jurisdiction',
    );
  });

  it('blocks sanctioned names', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
    );
    await expect(service.runChecks('Bad Actor', '1.1.1.1')).rejects.toThrow(
      'Sanctioned individual',
    );
  });

  it('marks verification failed when provider denies', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const record: any = { id: 'v1', accountId: 'a1', status: 'pending', retries: 0 };
    const verifications: Partial<Repository<KycVerification>> = {
      findOneByOrFail: jest.fn().mockResolvedValue(record),
      save: jest.fn().mockResolvedValue(record),
    };
    const accounts: Partial<Repository<Account>> = {
      update: jest.fn(),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.apiUrl'
          ? 'https://kyc'
          : key === 'kyc.apiKey'
            ? 'key'
            : undefined,
    };
    const service = new KycService(
      provider,
      verifications as Repository<KycVerification>,
      accounts as Repository<Account>,
      config as ConfigService,
    );
    jest
      .spyOn(service, 'runChecks')
      .mockResolvedValue({ country: 'GB' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'denied', reason: 'fail' }),
    }) as any;
    await service.process({
      verificationId: 'v1',
      accountId: 'a1',
      name: 'user',
      ip: '1.1.1.1',
    });
    expect(verifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', result: { status: 'denied', reason: 'fail' } }),
    );
    expect(accounts.update).not.toHaveBeenCalled();
  });

  it('records provider errors', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const record: any = { id: 'v1', accountId: 'a1', status: 'pending', retries: 0 };
    const verifications: Partial<Repository<KycVerification>> = {
      findOneByOrFail: jest.fn().mockResolvedValue(record),
      save: jest.fn().mockResolvedValue(record),
    };
    const accounts: Partial<Repository<Account>> = {
      update: jest.fn(),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.apiUrl'
          ? 'https://kyc'
          : key === 'kyc.apiKey'
            ? 'key'
            : undefined,
    };
    const service = new KycService(
      provider,
      verifications as Repository<KycVerification>,
      accounts as Repository<Account>,
      config as ConfigService,
    );
    jest
      .spyOn(service, 'runChecks')
      .mockResolvedValue({ country: 'GB' });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;
    await expect(
      service.process({
        verificationId: 'v1',
        accountId: 'a1',
        name: 'user',
        ip: '1.1.1.1',
      }),
    ).rejects.toThrow('provider 500');
    expect(verifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
    expect(record.retries).toBe(1);
  });
});
