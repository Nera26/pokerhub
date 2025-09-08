import { KycService } from './kyc.service';
import type { Repository } from 'typeorm';
import type { KycVerification } from '../database/entities/kycVerification.entity';
import type { Account } from '../wallet/account.entity';
import type { CountryProvider } from '../auth/providers/country-provider';
import type { ConfigService } from '@nestjs/config';
import type { Pep } from '../database/entities/pep.entity';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

import { Account as WalletAccount } from '../wallet/account.entity';
import { JournalEntry } from '../wallet/journal-entry.entity';

describe('KycService common', () => {
  it('blocks users from restricted countries', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('US'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries'
          ? ['US']
          : key === 'kyc.sanctionedNames'
            ? []
            : undefined,
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      undefined as unknown as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await service.onModuleInit();
    await expect(
      service.runChecks('good', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow('Blocked jurisdiction');
  });

  it('blocks sanctioned names', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries'
          ? []
          : key === 'kyc.sanctionedNames'
            ? ['Bad Actor']
            : undefined,
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      undefined as unknown as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await service.onModuleInit();
    await expect(
      service.runChecks('Bad Actor', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow('Sanctioned individual');
  });

  it('blocks underage users', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries'
          ? []
          : key === 'kyc.sanctionedNames'
            ? []
            : undefined,
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      undefined as unknown as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await service.onModuleInit();
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
        key === 'kyc.blockedCountries'
          ? []
          : key === 'kyc.sanctionedNames'
            ? []
            : undefined,
    };
    const pepRepo: Partial<Repository<Pep>> = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: '1', name: 'famous politician' } as Pep),
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      pepRepo as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await service.onModuleInit();
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
        key === 'kyc.blockedCountries'
          ? []
          : key === 'kyc.sanctionedNames'
            ? []
            : undefined,
    };
    const pepRepo: Partial<Repository<Pep>> = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      pepRepo as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await service.onModuleInit();
    await expect(
      service.runChecks('Average Joe', '1.1.1.1', '1990-01-01'),
    ).resolves.toEqual({ country: 'GB' });
  });

  it('loads restrictions on module init', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const config: Partial<ConfigService> = {
      get: (key: string) =>
        key === 'kyc.blockedCountries'
          ? ['US']
          : key === 'kyc.sanctionedNames'
            ? ['Bad Actor']
            : undefined,
    };
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      undefined as unknown as Repository<Pep>,
      config as ConfigService,
      undefined,
    );
    await expect(
      service.runChecks('Bad Actor', '1.1.1.1', '1990-01-01'),
    ).resolves.toEqual({ country: 'GB' });
    await service.onModuleInit();
    await expect(
      service.runChecks('Bad Actor', '1.1.1.1', '1990-01-01'),
    ).rejects.toThrow('Sanctioned individual');
  });

  it('falls back to empty lists when config missing', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('US'),
    };
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const service = new KycService(
      {} as unknown as Repository<Account>,
      provider,
      {} as unknown as Repository<KycVerification>,
      undefined as unknown as Repository<Pep>,
      undefined,
      undefined,
    );
    await service.onModuleInit();
    const result = await service.runChecks(
      'Bad Actor',
      '1.1.1.1',
      '1990-01-01',
    );
    expect(result).toEqual({ country: 'US' });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  describe('wallet flows', () => {
    let dataSource: DataSource;
    let service: KycService;
    let accountId: string;
    const cache: any = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    beforeAll(async () => {
      const db = newDb();
      db.public.registerFunction({
        name: 'version',
        returns: 'text',
        implementation: () => 'pg-mem',
      });
      db.public.registerFunction({
        name: 'current_database',
        returns: 'text',
        implementation: () => 'test',
      });
      let seq = 1;
      db.public.registerFunction({
        name: 'uuid_generate_v4',
        returns: 'text',
        implementation: () => {
          const id = seq.toString(16).padStart(32, '0');
          seq++;
          return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
        },
      });
      dataSource = db.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [WalletAccount, JournalEntry],
        synchronize: true,
      }) as DataSource;
      await dataSource.initialize();

      const repo = dataSource.getRepository(WalletAccount);
      accountId = '11111111-1111-1111-1111-111111111111';
      await repo.save({
        id: accountId,
        name: 'user',
        balance: 0,
        currency: 'USD',
        kycVerified: false,
      });

      service = new KycService(
        repo as unknown as Repository<Account>,
        undefined,
        undefined as unknown as Repository<KycVerification>,
        undefined as unknown as Repository<Pep>,
        undefined,
        cache,
      );
      await service.onModuleInit();
    });

    afterAll(async () => {
      await dataSource.destroy();
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      const repo = dataSource.getRepository(WalletAccount);
      const acc = await repo.findOneByOrFail({ id: accountId });
      acc.kycVerified = false;
      await repo.save(acc);
    });

    it('verifies when provider approves', async () => {
      jest
        .spyOn(service as any, 'callProvider')
        .mockResolvedValue({ allowed: true });
      jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'checkGeoIp').mockResolvedValue(undefined);
      await service.verify(accountId, '1.1.1.1');
      const repo = dataSource.getRepository(WalletAccount);
      const acc = await repo.findOneByOrFail({ id: accountId });
      expect(acc.kycVerified).toBe(true);
    });

    it('throws when provider denies', async () => {
      jest
        .spyOn(service as any, 'callProvider')
        .mockResolvedValue({ allowed: false, reason: 'fail' });
      jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'checkGeoIp').mockResolvedValue(undefined);
      await expect(service.verify(accountId, '1.1.1.1')).rejects.toThrow('fail');
    });

    it('rejects geo-blocked locations', async () => {
      jest
        .spyOn(service as any, 'callProvider')
        .mockResolvedValue({ allowed: true });
      jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'checkGeoIp')
        .mockResolvedValue('region US blocked');
      await expect(service.verify(accountId, '1.1.1.1')).rejects.toThrow(
        'region US blocked',
      );
    });
  });
});
