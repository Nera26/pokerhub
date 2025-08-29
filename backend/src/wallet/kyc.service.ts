import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onfido, Region } from 'onfido';
import { Account } from './account.entity';

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
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  private onfido?: Onfido;

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

  async validate(account: Account, ip?: string): Promise<void> {
    if (!account.name) {
      throw new Error('Account missing required fields');
    }

    const denialKey = `kyc:denial:${account.id}`;
    const regionReason = this.getRegionBlockReason(account);
    if (regionReason) {
      await this.cache.set(denialKey, regionReason, { ttl: 86400 });
      throw new Error(regionReason);
    }
    if (ip) {
      const geoReason = await this.checkGeoIp(ip);
      if (geoReason) {
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
    if (sanctionReason) {
      await this.cache.set(denialKey, sanctionReason, { ttl: 86400 });
      throw new Error(sanctionReason);
    }

    const pepReason = await this.checkFlag(
      process.env.PEP_PROVIDER_URL ?? '',
      account,
      'pep',
    );
    if (pepReason) {
      await this.cache.set(denialKey, pepReason, { ttl: 86400 });
      throw new Error(pepReason);
    }

    const key = `kyc:${account.id}`;
    let result = await this.cache.get<ProviderResult>(key);
    if (!result) {
      result = await this.callProvider(account);
      await this.cache.set(key, result, { ttl: 3600 });
    }

    if (result.allowed) {
      account.kycVerified = true;
      await this.accounts.update(account.id, { kycVerified: true });
      await this.cache.del(key);
      await this.cache.del(denialKey);
    } else {
      const reason = result.reason ?? 'KYC verification failed';
      await this.cache.set(denialKey, reason, { ttl: 86400 });
      throw new Error(reason);
    }
  }

  async verify(accountId: string, ip?: string): Promise<void> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    await this.validate(account, ip);
  }

  async isVerified(accountId: string, ip?: string): Promise<boolean> {
    const account = await this.accounts.findOneByOrFail({ id: accountId });
    try {
      await this.validate(account, ip);
      return true;
    } catch {
      return false;
    }
  }

  async getDenialReason(accountId: string): Promise<string | undefined> {
    return (await this.cache.get<string>(`kyc:denial:${accountId}`)) ?? undefined;
  }
}
