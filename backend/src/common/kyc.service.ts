import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { metrics } from '@opentelemetry/api';
import { KycVerification } from '../database/entities/kycVerification.entity';
import { Account } from '../wallet/account.entity';
import { CountryProvider } from '../auth/providers/country-provider';
import { fetchWithRetry, CircuitBreakerState } from './http';
import { Pep } from '../database/entities/pep.entity';
import { Onfido, Region } from 'onfido';

export interface VerificationJob {
  verificationId: string;
  accountId: string;
  name: string;
  birthdate: string;
  ip: string;
}

interface ProviderResult {
  allowed: boolean;
  reason?: string;
}

interface FlagResult {
  flagged: boolean;
  reason?: string;
}

interface GeoResult {
  country?: string;
}

@Injectable()
export class KycService {
  private readonly blockedCountries: string[];
  private readonly sanctionedNames = ['bad actor'];

  private queue?: Queue;

  private static readonly meter = metrics.getMeter('kyc');
  private static readonly retriesExhausted = KycService.meter.createCounter(
    'kyc_provider_retry_exhausted_total',
    {
      description: 'Number of KYC provider API calls that exhausted retries',
    },
  );

  private circuitBreaker: CircuitBreakerState = { failures: 0, openUntil: 0 };
  private onfido?: Onfido;

  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @Optional()
    @Inject('COUNTRY_PROVIDER')
    private readonly provider?: CountryProvider,
    @Optional()
    @InjectRepository(KycVerification)
    private readonly verifications?: Repository<KycVerification>,
    @Optional()
    @InjectRepository(Pep)
    private readonly peps?: Repository<Pep>,
    @Optional()
    private readonly config?: ConfigService,
    @Optional()
    @Inject(CACHE_MANAGER)
    private readonly cache?: Cache,
  ) {
    this.blockedCountries =
      this.config?.get<string[]>('kyc.blockedCountries') ?? [
        'IR',
        'KP',
        'SY',
        'CU',
        'RU',
        'BY',
      ];
  }

  private async getQueue(): Promise<Queue> {
    if (this.queue) return this.queue;
    const bull = await import('bullmq');
    this.queue = new bull.Queue('kyc', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });
    return this.queue;
  }

  async requestVerification(
    accountId: string,
    name: string,
    birthdate: string,
    ip: string,
  ): Promise<KycVerification> {
    if (!this.verifications) {
      throw new Error('KYC verification store not configured');
    }
    const record = await this.verifications.save({
      accountId,
      provider: this.provider?.constructor.name ?? 'unknown',
      status: 'pending',
    });
    const queue = await this.getQueue();
    await queue.add('verify', {
      verificationId: record.id,
      accountId,
      name,
      birthdate,
      ip,
    } as VerificationJob);
    return record;
  }

  private async isPoliticallyExposed(name: string): Promise<boolean> {
    if (!this.peps) return false;
    const match = await this.peps.findOneBy({ name: name.toLowerCase() });
    return !!match;
  }

  async runChecks(
    name: string,
    ip: string,
    birthdate: string,
  ): Promise<{ country: string }> {
    if (!this.provider) {
      return { country: 'unknown' };
    }
    const country = await this.provider.getCountry(ip);
    if (this.blockedCountries.includes(country)) {
      throw new Error('Blocked jurisdiction');
    }
    const lowered = name.toLowerCase();
    if (this.sanctionedNames.includes(lowered)) {
      throw new Error('Sanctioned individual');
    }
    const ageMs = Date.now() - new Date(birthdate).getTime();
    const age = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      throw new Error('Underage');
    }
    if (await this.isPoliticallyExposed(name)) {
      throw new Error('Politically exposed person');
    }
    return { country };
  }

  private getClient(): Onfido | undefined {
    const token = process.env.ONFIDO_API_TOKEN;
    if (!token) return undefined;
    if (!this.onfido) {
      this.onfido = new Onfido({ apiToken: token, region: Region.EU });
    }
    return this.onfido;
  }

  private async checkFlag(
    url: string,
    account: Account,
    type: string,
  ): Promise<string | undefined> {
    if (!url) {
      return `${type} provider not configured`;
    }
    try {
      const res = await fetch(`${url}?name=${encodeURIComponent(account.name)}`);
      if (!res.ok) {
        return `${type} provider error ${res.status}`;
      }
      const data = (await res.json()) as FlagResult;
      if (data.flagged) {
        return data.reason || `${type} match`;
      }
      return undefined;
    } catch {
      return `${type} provider unreachable`;
    }
  }

  private async callProvider(account: Account): Promise<ProviderResult> {
    const client = this.getClient();
    if (!client) {
      return { allowed: false, reason: 'KYC provider not configured' };
    }
    try {
      const applicant = await client.applicant.create({
        firstName: account.name,
        lastName: account.name,
      });
      const check = await client.check.create({
        applicantId: applicant.id,
        reportNames: ['document', 'facial_similarity'],
      });
      return { allowed: check.result === 'clear', reason: check.result };
    } catch (err) {
      return { allowed: false, reason: (err as Error).message };
    }
  }

  private getRegionBlockReason(account: Account): string | undefined {
    const regions =
      process.env.KYC_BLOCKED_REGIONS?.split(',').map((r) => r.trim().toUpperCase()) ?? [];
    const region = (account as any).region?.toUpperCase();
    if (region && regions.includes(region)) {
      return `region ${region} blocked`;
    }
    return undefined;
  }

  private async checkGeoIp(ip: string): Promise<string | undefined> {
    const url = process.env.GEOIP_PROVIDER_URL;
    if (!url) return undefined;
    try {
      const res = await fetch(`${url}?ip=${encodeURIComponent(ip)}`);
      if (!res.ok) {
        return `geoip provider error ${res.status}`;
      }
      const data = (await res.json()) as GeoResult;
      const regions =
        process.env.KYC_BLOCKED_REGIONS?.split(',').map((r) => r.trim().toUpperCase()) ?? [];
      const country = data.country?.toUpperCase();
      if (country && regions.includes(country)) {
        return `region ${country} blocked`;
      }
      return undefined;
    } catch {
      return 'geoip provider unreachable';
    }
  }

  async validate(account: Account, ip?: string, birthdate?: string): Promise<void> {
    if (!account.name) {
      throw new Error('Account missing required fields');
    }

    if (birthdate && this.provider) {
      await this.runChecks(account.name, ip ?? '0.0.0.0', birthdate);
    }

    const denialKey = `kyc:denial:${account.id}`;
    const regionReason = this.getRegionBlockReason(account);
    if (regionReason && this.cache) {
      await this.cache.set(denialKey, regionReason, { ttl: 86400 });
      throw new Error(regionReason);
    }
    if (ip) {
      const geoReason = await this.checkGeoIp(ip);
      if (geoReason && this.cache) {
        await this.cache.set(denialKey, geoReason, { ttl: 86400 });
        throw new Error(geoReason);
      }
    }
    if (account.kycVerified) {
      return;
    }

    const sanctionReason = await this.checkFlag(
      process.env.SANCTIONS_PROVIDER_URL ?? '',
      account,
      'sanctions',
    );
    if (sanctionReason && this.cache) {
      await this.cache.set(denialKey, sanctionReason, { ttl: 86400 });
      throw new Error(sanctionReason);
    }

    const pepReason = await this.checkFlag(
      process.env.PEP_PROVIDER_URL ?? '',
      account,
      'pep',
    );
    if (pepReason && this.cache) {
      await this.cache.set(denialKey, pepReason, { ttl: 86400 });
      throw new Error(pepReason);
    }

    const key = `kyc:${account.id}`;
    let result = this.cache ? await this.cache.get<ProviderResult>(key) : undefined;
    if (!result) {
      result = await this.callProvider(account);
      if (this.cache) {
        await this.cache.set(key, result, { ttl: 3600 });
      }
    }

    if (result.allowed) {
      account.kycVerified = true;
      await this.accounts.update(account.id, { kycVerified: true });
      if (this.cache) {
        await this.cache.del(key);
        await this.cache.del(denialKey);
      }
    } else {
      const reason = result.reason ?? 'KYC verification failed';
      if (this.cache) {
        await this.cache.set(denialKey, reason, { ttl: 86400 });
      }
      throw new Error(reason);
    }
  }

  async verify(accountId: string, ip?: string, birthdate?: string): Promise<void> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    await this.validate(account, ip, birthdate);
  }

  async isVerified(accountId: string, ip?: string, birthdate?: string): Promise<boolean> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    try {
      await this.validate(account, ip, birthdate);
      return true;
    } catch {
      return false;
    }
  }

  async getDenialReason(accountId: string): Promise<string | undefined> {
    if (!this.cache) return undefined;
    return (await this.cache.get<string>(`kyc:denial:${accountId}`)) ?? undefined;
  }

  async validateJob(job: VerificationJob): Promise<void> {
    if (!this.verifications || !this.config) {
      throw new Error('KYC verification not configured');
    }
    const record = await this.verifications.findOneByOrFail({
      id: job.verificationId,
    });
    try {
      const { country } = await this.runChecks(
        job.name,
        job.ip,
        job.birthdate,
      );
      const apiUrl = this.config.get<string>('kyc.apiUrl');
      const apiKey = this.config.get<string>('kyc.apiKey');

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          id: record.id,
          accountId: job.accountId,
          name: job.name,
          ip: job.ip,
          country,
        }),
      }, {
        onRetryExhausted: () => KycService.retriesExhausted.add(1),
        circuitBreaker: {
          state: this.circuitBreaker,
          threshold: 5,
          cooldownMs: 30_000,
          openMessage: 'KYC provider circuit breaker open',
        },
      });

      const providerData = (await response.json()) as {
        status: string;
        [key: string]: unknown;
      };

      record.result = providerData;

      if (providerData.status === 'approved') {
        record.status = 'verified';
        await this.verifications.save(record);
        await this.accounts.update(job.accountId, { kycVerified: true });
      } else if (providerData.status === 'pending') {
        record.status = 'pending';
        await this.verifications.save(record);
        const queue = await this.getQueue();
        await queue.add('verify', job, { delay: 30000 });
      } else {
        record.status = 'failed';
        await this.verifications.save(record);
      }
    } catch (err) {
      record.status = 'failed';
      record.result = { error: (err as Error).message };
      record.retries += 1;
      await this.verifications.save(record);
      throw err;
    }
  }

  async handleProviderUpdate(
    verificationId: string,
    result: { status: string; [key: string]: unknown },
  ): Promise<void> {
    if (!this.verifications) return;
    const record = await this.verifications.findOneByOrFail({ id: verificationId });
    record.result = result;
    if (result.status === 'approved') {
      record.status = 'verified';
      await this.accounts.update(record.accountId, { kycVerified: true });
    } else {
      record.status = 'failed';
    }
    await this.verifications.save(record);
  }
}
