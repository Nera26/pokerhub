import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrecacheListResponse, PrecacheListResponseSchema } from '../schemas/precache';

const PRECACHE_URLS: string[] = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      '..',
      'frontend',
      '.next',
      'precache-manifest.json',
    ),
    'utf-8',
  ),
);

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
