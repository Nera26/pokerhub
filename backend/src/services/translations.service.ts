import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { TranslationEntity } from '../database/entities/translation.entity';

export const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(TranslationEntity)
    private readonly repo: Repository<TranslationEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  private cacheKey(lang: string): string {
    return `translations:${lang}`;
  }

  private async loadFromDb(lang: string): Promise<Record<string, string>> {
    const rows = await this.repo.find({ where: { lang } });
    const messages: Record<string, string> = {};
    for (const row of rows) {
      messages[row.key] = row.value;
    }
    return messages;
  }

  async get(lang: string): Promise<Record<string, string>> {
    const key = this.cacheKey(lang);
    const cached = await this.cache.get<Record<string, string>>(key);
    if (cached) return cached;

    let messages = await this.loadFromDb(lang);
    if (Object.keys(messages).length === 0 && lang !== 'en') {
      messages = await this.get('en');
    }

    await this.cache.set(key, messages, { ttl: CACHE_TTL });
    return messages;
  }
}
