import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { KycVerification } from '../database/entities/kycVerification.entity';
import { Account } from '../wallet/account.entity';
import { CountryProvider } from './providers/country-provider';

export interface VerificationJob {
  verificationId: string;
  accountId: string;
  name: string;
  ip: string;
}

@Injectable()
export class KycService {
  private readonly blockedCountries = ['IR', 'KP', 'SY', 'CU', 'RU', 'BY'];

  private readonly sanctionedNames = ['bad actor'];

  private queue?: Queue;

  constructor(
    @Inject('COUNTRY_PROVIDER')
    private readonly provider: CountryProvider,
    @InjectRepository(KycVerification)
    private readonly verifications: Repository<KycVerification>,
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    private readonly config: ConfigService,
  ) {}

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
    ip: string,
  ): Promise<KycVerification> {
    const record = await this.verifications.save({
      accountId,
      provider: this.provider.constructor.name,
      status: 'pending',
    });
    const queue = await this.getQueue();
    await queue.add('verify', {
      verificationId: record.id,
      accountId,
      name,
      ip,
    } as VerificationJob);
    return record;
  }

  async runChecks(name: string, ip: string): Promise<{ country: string }> {
    const country = await this.provider.getCountry(ip);
    if (this.blockedCountries.includes(country)) {
      throw new Error('Blocked jurisdiction');
    }
    const lowered = name.toLowerCase();
    if (this.sanctionedNames.includes(lowered)) {
      throw new Error('Sanctioned individual');
    }
    return { country };
  }

  async process(job: VerificationJob): Promise<void> {
    const record = await this.verifications.findOneByOrFail({
      id: job.verificationId,
    });
    try {
      const { country } = await this.runChecks(job.name, job.ip);
      const apiUrl = this.config.get<string>('kyc.apiUrl');
      const apiKey = this.config.get<string>('kyc.apiKey');

      const response = await fetch(apiUrl, {
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
      });

      if (!response.ok) {
        throw new Error(`provider ${response.status}`);
      }

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
