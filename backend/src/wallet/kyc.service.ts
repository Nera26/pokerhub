import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

interface ProviderResult {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  private async callProvider(account: Account): Promise<ProviderResult> {
    const url = process.env.KYC_PROVIDER_URL;
    if (!url) {
      return { allowed: false, reason: 'KYC provider not configured' };
    }
    try {
      const res = await fetch(`${url}?name=${encodeURIComponent(account.name)}`);
      if (!res.ok) {
        return { allowed: false, reason: `provider error ${res.status}` };
      }
      const data = (await res.json()) as ProviderResult;
      return { allowed: !!data.allowed, reason: data.reason };
    } catch {
      return { allowed: false, reason: 'KYC provider unreachable' };
    }
  }

  async validate(account: Account): Promise<void> {
    if (!account.name) {
      throw new Error('Account missing required fields');
    }
    if (account.kycVerified) {
      return;
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
    } else {
      throw new Error(result.reason ?? 'KYC verification failed');
    }
  }

  async getDenialReason(accountId: string): Promise<string | undefined> {
    const result = await this.cache.get<ProviderResult>(`kyc:${accountId}`);
    return result && !result.allowed ? result.reason : undefined;
  }
}
