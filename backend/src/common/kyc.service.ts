import {
  Inject,
  Injectable,
  Optional,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { KycVerification } from '../database/entities/kycVerification.entity';
import { Account } from '../wallet/account.entity';
import type { CountryProvider } from '../auth/providers/country-provider';
import { z } from 'zod';
import { fetchJson } from '@shared/utils/http';
import { Pep } from '../database/entities/pep.entity';
import { Onfido, Region } from 'onfido';
import { createQueue } from '../redis/queue';
import { logInfrastructureNotice } from './logging';

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
export class KycService implements OnModuleInit {
  private blockedCountries: string[] = [];
  private sanctionedNames: string[] = [];
  private readonly logger = new Logger(KycService.name);

  private queue?: Queue;
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
  ) {}

  private async loadListFromDb(
    table: string,
    column: string,
  ): Promise<string[] | undefined> {
    const repo: any = this.accounts;
    if (!repo || typeof repo.query !== 'function') return undefined;
    try {
      const rows = await repo.query(`SELECT ${column} FROM ${table}`);
      return rows.map((r: any) => String(r[column]));
    } catch {
      return undefined;
    }
  }

  private getConfiguredBlockedCountries(): string[] {
    const configured = this.config?.get<string[]>('kyc.blockedCountries') ?? [];
    return configured.map((c) => c.toUpperCase());
  }

  private applyBlockedCountries(
    blocked: string[] | undefined,
    {
      fallbackToConfig,
      warnOnEmpty,
    }: { fallbackToConfig: boolean; warnOnEmpty: boolean },
  ): string[] {
    let normalized = blocked?.map((c) => c.toUpperCase());
    if (normalized === undefined && fallbackToConfig) {
      normalized = this.getConfiguredBlockedCountries();
    }
    if (!normalized || normalized.length === 0) {
      if (warnOnEmpty) {
        logInfrastructureNotice('No blocked countries configured; using empty list', {
          logger: this.logger,
        });
      }
      normalized = [];
    }
    this.blockedCountries = normalized;
    return this.blockedCountries;
  }

  async refreshBlockedCountries({
    warnOnEmpty = false,
    fallbackToConfig = false,
  }: { warnOnEmpty?: boolean; fallbackToConfig?: boolean } = {}): Promise<string[]> {
    const blocked = await this.loadListFromDb('blocked_countries', 'country');
    const shouldFallback = blocked === undefined && fallbackToConfig;
    return this.applyBlockedCountries(blocked, {
      fallbackToConfig: shouldFallback,
      warnOnEmpty,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.refreshBlockedCountries({ warnOnEmpty: true, fallbackToConfig: true });

    let sanctioned = this.config?.get<string[]>('kyc.sanctionedNames');
    if (!sanctioned || sanctioned.length === 0) {
      sanctioned = await this.loadListFromDb('sanctioned_names', 'name');
    }
    if (!sanctioned || sanctioned.length === 0) {
      logInfrastructureNotice('No sanctioned names configured; using empty list', {
        logger: this.logger,
      });
      sanctioned = [];
    }
    this.sanctionedNames = sanctioned.map((n) => n.toLowerCase());
  }

  private async getQueue(): Promise<Queue> {
    if (this.queue) return this.queue;
    this.queue = await createQueue('kyc');
    if (!this.queue.opts.connection) {
      logInfrastructureNotice('KYC verification queue disabled; Redis queue connection is unavailable.', {
        logger: this.logger,
      });
    }
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
    if (!queue.opts.connection) {
      logInfrastructureNotice(
        'Redis queue connection is unavailable; processing KYC verification inline.',
        { logger: this.logger },
      );
      await this.validateJob({
        verificationId: record.id,
        accountId,
        name,
        birthdate,
        ip,
      });
      return record;
    }
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
    const normalizedCountry = country.toUpperCase();
    if (this.blockedCountries.includes(normalizedCountry)) {
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
      await this.cache.set(denialKey, regionReason, 86400);
      throw new Error(regionReason);
    }
    if (ip) {
      const geoReason = await this.checkGeoIp(ip);
      if (geoReason && this.cache) {
        await this.cache.set(denialKey, geoReason, 86400);
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
      await this.cache.set(denialKey, sanctionReason, 86400);
      throw new Error(sanctionReason);
    }

    const pepReason = await this.checkFlag(
      process.env.PEP_PROVIDER_URL ?? '',
      account,
      'pep',
    );
    if (pepReason && this.cache) {
      await this.cache.set(denialKey, pepReason, 86400);
      throw new Error(pepReason);
    }

    const key = `kyc:${account.id}`;
    let result = this.cache ? await this.cache.get<ProviderResult>(key) : undefined;
    if (!result) {
      result = await this.callProvider(account);
      if (this.cache) {
        await this.cache.set(key, result, 3600);
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
        await this.cache.set(denialKey, reason, 86400);
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
      if (!apiUrl || apiUrl.trim() === '') {
        throw new Error('KYC provider API URL not configured');
      }
      const apiKey = this.config.get<string>('kyc.apiKey');
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('KYC provider API key not configured');
      }
      const normalizedUrl = apiUrl.trim();
      const normalizedKey = apiKey.trim();

      const providerData = await fetchJson(
        normalizedUrl,
        z.object({ status: z.string() }).passthrough(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${normalizedKey}`,
          },
          body: JSON.stringify({
            id: record.id,
            accountId: job.accountId,
            name: job.name,
            ip: job.ip,
            country,
          }),
        },
      );

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
