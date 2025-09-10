import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  PrecacheListResponse,
  PrecacheListResponseSchema,
} from '../schemas/precache';

function loadPrecacheUrls(): string[] {
  // 1) Prefer explicit env var: "a.js,b.css,/foo/bar"
  if (process.env.PRECACHE_URLS) {
    return process.env.PRECACHE_URLS
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // 2) Fallback to the Next.js precache manifest, if available
  try {
    const manifestPath = join(
      process.cwd(),
      '..',
      'frontend',
      '.next',
      'precache-manifest.json',
    );
    const raw = readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Support either an array of strings, or an object with "urls"
    if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === 'string');
    if (Array.isArray(parsed?.urls)) return parsed.urls.filter((u: unknown) => typeof u === 'string');

    return [];
  } catch {
    // No manifest available in this environment
    return [];
  }
}

const PRECACHE_URLS: string[] = loadPrecacheUrls();

@ApiTags('precache')
@Controller('precache')
export class PrecacheController {
  @Get()
  @ApiOperation({ summary: 'List asset URLs to pre-cache' })
  @ApiResponse({ status: 200, description: 'Asset URLs', type: [String] })
  list(): PrecacheListResponse {
    return PrecacheListResponseSchema.parse(PRECACHE_URLS);
  }
}
