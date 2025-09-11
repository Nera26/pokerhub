import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ConfigService {
  async getPrecacheUrls(): Promise<string[]> {
    if (process.env.PRECACHE_URLS) {
      return process.env.PRECACHE_URLS.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    try {
      const manifestPath = join(
        process.cwd(),
        '..',
        'frontend',
        '.next',
        'precache-manifest.json',
      );
      const raw = await readFile(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((u) => typeof u === 'string');
      }
      if (Array.isArray(parsed?.urls)) {
        return parsed.urls.filter((u: unknown) => typeof u === 'string');
      }
    } catch {
      // ignore
    }
    return [];
  }
}

