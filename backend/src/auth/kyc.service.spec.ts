import { KycService } from './kyc.service';
import type { Repository } from 'typeorm';
import type { KycVerification } from '../database/entities/kycVerification.entity';
import type { Account } from '../wallet/account.entity';
import type { CountryProvider } from './providers/country-provider';
import type { ConfigService } from '@nestjs/config';
import type { Pep } from '../database/entities/pep.entity';

describe('KycService', () => {
  it('blocks users from restricted countries', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('US'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries' ? ['US'] : undefined,
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
      config as ConfigService,
      {} as unknown as Repository<Pep>,
    );
    await expect(
      service.runChecks('good', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow(
      'Blocked jurisdiction',
    );
  });

  it('blocks sanctioned names', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries' ? [] : undefined,
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
      config as ConfigService,
      {} as unknown as Repository<Pep>,
    );
    await expect(
      service.runChecks('Bad Actor', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow(
      'Sanctioned individual',
    );
  });

  it('blocks underage users', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries' ? [] : undefined,
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
      config as ConfigService,
      {} as unknown as Repository<Pep>,
    );
    await expect(
      service.runChecks('Young User', '1.1.1.1', '2010-01-01'),
    ).rejects.toThrow('Underage');
  });

  it('blocks politically exposed persons', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries' ? [] : undefined,
    };
    const pepRepo: Partial<Repository<Pep>> = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: '1', name: 'famous politician' } as Pep),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
      config as ConfigService,
      pepRepo as Repository<Pep>,
    );
    await expect(
      service.runChecks('Famous Politician', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow('Politically exposed person');
  });

  it('allows non-politically exposed persons', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries' ? [] : undefined,
    };
    const pepRepo: Partial<Repository<Pep>> = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
      config as ConfigService,
      pepRepo as Repository<Pep>,
    );
    await expect(
      service.runChecks('Average Joe', '1.1.1.1', '1990-01-01'),
    ).resolves.toEqual({ country: 'GB' });
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
      {} as unknown as Repository<Pep>,
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
      birthdate: '1990-01-01',
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
      {} as unknown as Repository<Pep>,
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
        birthdate: '1990-01-01',
        ip: '1.1.1.1',
      }),
    ).rejects.toThrow(
      'Request to https://kyc failed after 3 attempts: HTTP 500',
    );
    expect(verifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
    expect(record.retries).toBe(1);
  });

  it('trips circuit breaker after repeated provider failures', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const record: any = {
      id: 'v1',
      accountId: 'a1',
      status: 'pending',
      retries: 0,
    };
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
      {} as unknown as Repository<Pep>,
    );
    jest
      .spyOn(service, 'runChecks')
      .mockResolvedValue({ country: 'GB' });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;

    for (let i = 0; i < 5; i++) {
      await expect(
        service.process({
          verificationId: 'v1',
          accountId: 'a1',
          name: 'user',
          birthdate: '1990-01-01',
          ip: '1.1.1.1',
        }),
      ).rejects.toThrow(
        'Request to https://kyc failed after 3 attempts: HTTP 500',
      );
    }

    await expect(
      service.process({
        verificationId: 'v1',
        accountId: 'a1',
        name: 'user',
        birthdate: '1990-01-01',
        ip: '1.1.1.1',
      }),
    ).rejects.toThrow('KYC provider circuit breaker open');

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(5 * 3);
  });
});
